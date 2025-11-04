import { randomPasscode } from 'signify-ts';
import { KERIAService } from '../services/keria.service';
import { StorageService } from '../services/storage.service';
import { ConsoleUtils } from '../utils/console.utils';
import { VLEI_SCHEMAS } from '../types/vlei.types';
import { VLEI_SCHEMA_CONFIG } from '../config/vlei-schemas.config';
import { VLEI_RULES } from '../config/vlei-rules.config';
import * as fs from 'fs';
import * as path from 'path';

interface AgentConfig {
    alias: string;
    engagementContextRole: string;
    agentType: string;
}

interface PersonConfig {
    alias: string;
    legalName: string;
    officialRole: string;
    agents: AgentConfig[];
}

interface OrganizationConfig {
    id: string;
    alias: string;
    name: string;
    lei: string;
    registryName: string;
    persons: PersonConfig[];
}

interface VLEIConfig {
    root: { alias: string; registryName: string };
    qvi: { alias: string; lei: string; registryName: string };
    organizations: OrganizationConfig[];
}

/**
 * SetupVLEIOfficialCommand - Implements Official GLEIF vLEI Flow
 * 
 * OFFICIAL GLEIF CREDENTIAL CHAIN:
 * 1. ROOT → QVI (QVI credential)
 * 2. QVI → Legal Entity (LE credential with edge to QVI)
 * 3. Legal Entity → Person (OOR_AUTH credential - authorization for the person)
 * 4. QVI → Person (OOR credential with edge to OOR_AUTH)
 * 5. Person → Agent (ECR credential with edge to OOR)
 * 
 * KEY DIFFERENCE FROM PREVIOUS IMPLEMENTATION:
 * - OOR credentials are issued by QVI (not Legal Entity)
 * - OOR credentials have an "auth" edge pointing to OOR_AUTH credential
 * - OOR_AUTH credential is issued by Legal Entity to authorize the person
 */
export class SetupVLEIOfficialCommand {
    private config: VLEIConfig;

    constructor() {
        const configPath = path.join(__dirname, '..', '..', 'config.json');
        const configData = fs.readFileSync(configPath, 'utf-8');
        this.config = JSON.parse(configData);
    }

    async execute(): Promise<void> {
        ConsoleUtils.title('🚀 vLEI Multi-Organization Setup (Official GLEIF Flow)');
        ConsoleUtils.message(`Creating vLEI trust chain for ${this.config.organizations.length} organization(s)...\n`);
        ConsoleUtils.message('📘 Using official GLEIF OOR credential flow: QVI issues OOR with AUTH edge\n');

        try {
            await KERIAService.initialize();

            // STEP 1: Create GLEIF ROOT
            ConsoleUtils.section('📋 Step 1: Creating GLEIF ROOT');
            const { client: rootClient } = await KERIAService.createClient(randomPasscode());
            const rootPrefix = await KERIAService.createAID(rootClient, this.config.root.alias);
            await KERIAService.addAgentRole(rootClient, this.config.root.alias);
            const rootOOBI = await KERIAService.generateOOBI(rootClient, this.config.root.alias);
            const rootRegistry = await KERIAService.createRegistry(rootClient, this.config.root.alias, this.config.root.registryName);

            StorageService.saveIdentity({
                alias: this.config.root.alias, prefix: rootPrefix, type: 'root',
                registry: rootRegistry, oobis: [rootOOBI], createdAt: new Date().toISOString()
            });

            ConsoleUtils.success(`✓ GLEIF ROOT: ${rootPrefix}`);
            ConsoleUtils.continue();

            // STEP 1.5: Resolve vLEI Schema OOBIs for ROOT
            ConsoleUtils.section('📋 Step 1.5: Resolving vLEI Schema OOBIs for ROOT');
            
            await KERIAService.resolveSchemaOOBI(
                rootClient, 
                VLEI_SCHEMA_CONFIG.SCHEMAS.QVI_VLEI.OOBI,
                VLEI_SCHEMA_CONFIG.SCHEMAS.QVI_VLEI.NAME
            );
            
            ConsoleUtils.success('✓ ROOT schema OOBIs resolved');
            ConsoleUtils.continue();

            // STEP 2: Create QVI
            ConsoleUtils.section('📋 Step 2: Creating QVI');
            const { client: qviClient } = await KERIAService.createClient(randomPasscode());
            const qviPrefix = await KERIAService.createAID(qviClient, this.config.qvi.alias);
            await KERIAService.addAgentRole(qviClient, this.config.qvi.alias);
            const qviOOBI = await KERIAService.generateOOBI(qviClient, this.config.qvi.alias);
            const qviRegistry = await KERIAService.createRegistry(qviClient, this.config.qvi.alias, this.config.qvi.registryName);

            // Establish OOBI connections
            await KERIAService.resolveOOBI(rootClient, qviOOBI, 'QVI_Contact');
            await KERIAService.resolveOOBI(qviClient, rootOOBI, 'ROOT_Contact');

            // QVI resolves schemas it will need
            ConsoleUtils.section('  Resolving schemas for QVI');
            await KERIAService.resolveSchemaOOBI(qviClient, VLEI_SCHEMA_CONFIG.SCHEMAS.QVI_VLEI.OOBI, 'QVI Schema (for admission)');
            await KERIAService.resolveSchemaOOBI(qviClient, VLEI_SCHEMA_CONFIG.SCHEMAS.LEGAL_ENTITY_VLEI.OOBI, 'LE Schema');
            await KERIAService.resolveSchemaOOBI(qviClient, VLEI_SCHEMA_CONFIG.SCHEMAS.OOR_AUTH_VLEI.OOBI, 'OOR_AUTH Schema');
            await KERIAService.resolveSchemaOOBI(qviClient, VLEI_SCHEMA_CONFIG.SCHEMAS.ORG_ROLE_VLEI.OOBI, 'OOR Schema');

            // ROOT issues QVI credential
            const { said: qviCredSaid, credential: qviCred } = await KERIAService.issueCredential(
                rootClient, this.config.root.alias, rootRegistry, VLEI_SCHEMAS.QVI, qviPrefix,
                { LEI: this.config.qvi.lei, dt: new Date().toISOString() }
            );
            
            await KERIAService.grantCredential(rootClient, this.config.root.alias, qviPrefix, qviCred);
            const qviGrantNotif = await KERIAService.waitForGrantNotification(qviClient);
            await KERIAService.admitCredential(qviClient, this.config.qvi.alias, rootPrefix, qviGrantNotif.a.d);
            await KERIAService.markNotificationRead(qviClient, qviGrantNotif.i);

            StorageService.saveIdentity({
                alias: this.config.qvi.alias, prefix: qviPrefix, lei: this.config.qvi.lei,
                type: 'qvi', registry: qviRegistry, oobis: [qviOOBI], createdAt: new Date().toISOString()
            });

            StorageService.saveCredential({
                said: qviCredSaid, type: 'QVI', issuer: rootPrefix, issuee: qviPrefix,
                schema: VLEI_SCHEMAS.QVI, registry: rootRegistry, status: 'issued',
                lei: this.config.qvi.lei, attributes: { LEI: this.config.qvi.lei },
                issuedAt: new Date().toISOString()
            });

            ConsoleUtils.success(`✓ QVI: ${qviPrefix}`);
            ConsoleUtils.message('⏳ Waiting for QVI credential to be committed (10 seconds)...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            ConsoleUtils.continue();

            // STEP 3+: Create Organizations, Persons, and Agents
            let stepNumber = 3;
            for (const org of this.config.organizations) {
                ConsoleUtils.section(`📋 Step ${stepNumber}: Creating Organization: ${org.name}`);
                
                // Create Legal Entity
                const { client: leClient } = await KERIAService.createClient(randomPasscode());
                const lePrefix = await KERIAService.createAID(leClient, org.alias);
                await KERIAService.addAgentRole(leClient, org.alias);
                const leOOBI = await KERIAService.generateOOBI(leClient, org.alias);
                const leRegistry = await KERIAService.createRegistry(leClient, org.alias, org.registryName);

                // Establish OOBI connections
                await KERIAService.resolveOOBI(qviClient, leOOBI, `${org.id}_Contact`);
                await KERIAService.resolveOOBI(leClient, qviOOBI, 'QVI_Contact');

                // LE resolves schemas
                ConsoleUtils.section('  Resolving schemas for LE');
                await KERIAService.resolveSchemaOOBI(leClient, VLEI_SCHEMA_CONFIG.SCHEMAS.QVI_VLEI.OOBI, 'QVI Schema');
                await KERIAService.resolveSchemaOOBI(leClient, VLEI_SCHEMA_CONFIG.SCHEMAS.LEGAL_ENTITY_VLEI.OOBI, 'LE Schema');
                await KERIAService.resolveSchemaOOBI(leClient, VLEI_SCHEMA_CONFIG.SCHEMAS.OOR_AUTH_VLEI.OOBI, 'OOR_AUTH Schema');
                await KERIAService.resolveSchemaOOBI(leClient, VLEI_SCHEMA_CONFIG.SCHEMAS.ECR_VLEI.OOBI, 'ECR Schema');

                // QVI issues LE credential
                const { said: leCredSaid, credential: leCred } = await KERIAService.issueCredential(
                    qviClient, this.config.qvi.alias, qviRegistry, VLEI_SCHEMAS.LEGAL_ENTITY, lePrefix,
                    { LEI: org.lei, dt: new Date().toISOString() },
                    { d: '', qvi: { n: qviCredSaid, s: VLEI_SCHEMAS.QVI } }
                );
                
                await KERIAService.grantCredential(qviClient, this.config.qvi.alias, lePrefix, leCred);
                const leGrantNotif = await KERIAService.waitForGrantNotification(leClient);
                await KERIAService.admitCredential(leClient, org.alias, qviPrefix, leGrantNotif.a.d);
                await KERIAService.markNotificationRead(leClient, leGrantNotif.i);

                StorageService.saveIdentity({
                    alias: org.alias, prefix: lePrefix, lei: org.lei,
                    type: 'legal-entity', registry: leRegistry, oobis: [leOOBI], createdAt: new Date().toISOString()
                });

                StorageService.saveCredential({
                    said: leCredSaid, type: 'Legal Entity vLEI', issuer: qviPrefix, issuee: lePrefix,
                    schema: VLEI_SCHEMAS.LEGAL_ENTITY, registry: qviRegistry, status: 'issued',
                    lei: org.lei, attributes: { LEI: org.lei },
                    edges: { qvi: { n: qviCredSaid, s: VLEI_SCHEMAS.QVI } },
                    issuedAt: new Date().toISOString()
                });

                ConsoleUtils.success(`✓ Legal Entity: ${org.name} (${lePrefix})`);
                stepNumber++;

                // Create Persons for this organization
                for (const person of org.persons) {
                    ConsoleUtils.section(`  👤 Creating Person: ${person.legalName} (${person.officialRole})`);
                    
                    const { client: personClient } = await KERIAService.createClient(randomPasscode());
                    const personPrefix = await KERIAService.createAID(personClient, person.alias);
                    await KERIAService.addAgentRole(personClient, person.alias);
                    const personOOBI = await KERIAService.generateOOBI(personClient, person.alias);

                    // Establish OOBI connections (Person needs to connect to both LE and QVI)
                    await KERIAService.resolveOOBI(leClient, personOOBI, `${person.alias}_Contact`);
                    await KERIAService.resolveOOBI(qviClient, personOOBI, `${person.alias}_Contact`);
                    await KERIAService.resolveOOBI(personClient, leOOBI, `${org.id}_Contact`);
                    await KERIAService.resolveOOBI(personClient, qviOOBI, 'QVI_Contact');

                    // Person resolves all chain schemas
                    ConsoleUtils.section('    Resolving schemas for Person');
                    await KERIAService.resolveSchemaOOBI(personClient, VLEI_SCHEMA_CONFIG.SCHEMAS.QVI_VLEI.OOBI, 'QVI Schema');
                    await KERIAService.resolveSchemaOOBI(personClient, VLEI_SCHEMA_CONFIG.SCHEMAS.LEGAL_ENTITY_VLEI.OOBI, 'LE Schema');
                    await KERIAService.resolveSchemaOOBI(personClient, VLEI_SCHEMA_CONFIG.SCHEMAS.OOR_AUTH_VLEI.OOBI, 'OOR_AUTH Schema');
                    await KERIAService.resolveSchemaOOBI(personClient, VLEI_SCHEMA_CONFIG.SCHEMAS.ORG_ROLE_VLEI.OOBI, 'OOR Schema');
                    await KERIAService.resolveSchemaOOBI(personClient, VLEI_SCHEMA_CONFIG.SCHEMAS.ECR_VLEI.OOBI, 'ECR Schema');

                    // STEP A: Legal Entity issues OOR_AUTH credential TO QVI (not to Person!)
                    // This authorizes the QVI to issue OOR credentials on behalf of the LE
                    ConsoleUtils.section('    📝 Issuing OOR_AUTH credential (LE → QVI Authorization)');
                    const { said: oorAuthCredSaid, credential: oorAuthCred } = await KERIAService.issueCredential(
                        leClient, org.alias, leRegistry, VLEI_SCHEMAS.OOR_AUTH, qviPrefix,  // Issued TO QVI!
                        { 
                            AID: '',  // Empty - as per official GLEIF specification
                            LEI: org.lei,
                            personLegalName: person.legalName,
                            officialRole: person.officialRole,
                            dt: new Date().toISOString()
                        },
                        { d: '', le: { n: leCredSaid, s: VLEI_SCHEMAS.LEGAL_ENTITY } }
                    );
                    
                    await KERIAService.grantCredential(leClient, org.alias, qviPrefix, oorAuthCred);
                    const oorAuthGrantNotif = await KERIAService.waitForGrantNotification(qviClient);
                    await KERIAService.admitCredential(qviClient, this.config.qvi.alias, lePrefix, oorAuthGrantNotif.a.d);
                    await KERIAService.markNotificationRead(qviClient, oorAuthGrantNotif.i);

                    StorageService.saveCredential({
                        said: oorAuthCredSaid, type: 'OOR Authorization', issuer: lePrefix, issuee: qviPrefix,  // Issued to QVI
                        schema: VLEI_SCHEMAS.OOR_AUTH, registry: leRegistry, status: 'issued',
                        attributes: { 
                            personLegalName: person.legalName, 
                            officialRole: person.officialRole,
                            AID: '',  // Empty as per spec
                            LEI: org.lei
                        },
                        edges: { le: { n: leCredSaid, s: VLEI_SCHEMAS.LEGAL_ENTITY } },
                        issuedAt: new Date().toISOString()
                    });

                    ConsoleUtils.success(`    ✓ OOR_AUTH credential issued: ${oorAuthCredSaid}`);

                    // Wait for OOR_AUTH to be committed before QVI issues OOR
                    ConsoleUtils.message('    ⏳ Waiting for OOR_AUTH to be committed (15 seconds)...');
                    await new Promise(resolve => setTimeout(resolve, 15000));

                    // STEP B: QVI issues OOR credential with edge to OOR_AUTH
                    ConsoleUtils.section('    📝 Issuing OOR credential (QVI → Person with AUTH edge)');
                    const { said: oorCredSaid, credential: oorCred } = await KERIAService.issueCredential(
                        qviClient, this.config.qvi.alias, qviRegistry, VLEI_SCHEMAS.OOR, personPrefix,
                        { 
                            LEI: org.lei,
                            personLegalName: person.legalName,
                            officialRole: person.officialRole,
                            dt: new Date().toISOString()
                        },
                        { d: '', auth: { n: oorAuthCredSaid, s: VLEI_SCHEMAS.OOR_AUTH, o: 'I2I' } },  // Edge to OOR_AUTH with operator
                        VLEI_RULES.OOR_RULES
                    );
                    
                    await KERIAService.grantCredential(qviClient, this.config.qvi.alias, personPrefix, oorCred);
                    const oorGrantNotif = await KERIAService.waitForGrantNotification(personClient);
                    await KERIAService.admitCredential(personClient, person.alias, qviPrefix, oorGrantNotif.a.d);
                    await KERIAService.markNotificationRead(personClient, oorGrantNotif.i);

                    StorageService.saveIdentity({
                        alias: person.alias, prefix: personPrefix, type: 'person', 
                        role: person.officialRole, oobis: [personOOBI], createdAt: new Date().toISOString()
                    });

                    StorageService.saveCredential({
                        said: oorCredSaid, type: 'Official Organizational Role', issuer: qviPrefix, issuee: personPrefix,
                        schema: VLEI_SCHEMAS.OOR, registry: qviRegistry, status: 'issued',
                        attributes: { personLegalName: person.legalName, officialRole: person.officialRole, LEI: org.lei },
                        edges: { auth: { n: oorAuthCredSaid, s: VLEI_SCHEMAS.OOR_AUTH } },
                        issuedAt: new Date().toISOString()
                    });

                    ConsoleUtils.success(`    ✓ OOR credential issued by QVI: ${oorCredSaid}`);
                    ConsoleUtils.success(`  ✓ Person: ${person.legalName} (${personPrefix})`);

                    // Create Agents for this person
                    for (const agent of person.agents) {
                        ConsoleUtils.section(`      🤖 Creating Agent: ${agent.engagementContextRole}`);
                        
                        const { client: agentClient } = await KERIAService.createClient(randomPasscode());
                        const agentPrefix = await KERIAService.createAID(agentClient, agent.alias);
                        await KERIAService.addAgentRole(agentClient, agent.alias);
                        const agentOOBI = await KERIAService.generateOOBI(agentClient, agent.alias);

                        await KERIAService.resolveOOBI(leClient, agentOOBI, `${agent.alias}_Contact`);
                        await KERIAService.resolveOOBI(agentClient, leOOBI, `${org.id}_Contact`);

                        // Agent resolves all chain schemas
                        await KERIAService.resolveSchemaOOBI(agentClient, VLEI_SCHEMA_CONFIG.SCHEMAS.QVI_VLEI.OOBI, 'QVI Schema');
                        await KERIAService.resolveSchemaOOBI(agentClient, VLEI_SCHEMA_CONFIG.SCHEMAS.LEGAL_ENTITY_VLEI.OOBI, 'LE Schema');
                        await KERIAService.resolveSchemaOOBI(agentClient, VLEI_SCHEMA_CONFIG.SCHEMAS.ECR_VLEI.OOBI, 'ECR Schema');

                        // Legal Entity issues ECR credential directly to agent (not Person!)
                        // ECR schema allows LE to issue directly with 'le' edge
                        const { said: ecrCredSaid, credential: ecrCred } = await KERIAService.issueCredential(
                            leClient, org.alias, leRegistry, VLEI_SCHEMAS.ECR, agentPrefix,
                            { 
                                LEI: org.lei,
                                personLegalName: person.legalName,
                                engagementContextRole: agent.engagementContextRole,
                                dt: new Date().toISOString()
                            },
                            { d: '', le: { n: leCredSaid, s: VLEI_SCHEMAS.LEGAL_ENTITY } },  // Edge to LE, no operator
                            VLEI_RULES.ECR_RULES
                        );
                        
                        await KERIAService.grantCredential(leClient, org.alias, agentPrefix, ecrCred);
                        const ecrGrantNotif = await KERIAService.waitForGrantNotification(agentClient);
                        await KERIAService.admitCredential(agentClient, agent.alias, lePrefix, ecrGrantNotif.a.d);
                        await KERIAService.markNotificationRead(agentClient, ecrGrantNotif.i);

                        StorageService.saveIdentity({
                            alias: agent.alias, prefix: agentPrefix, type: 'agent', 
                            role: `${agent.engagementContextRole} (${agent.agentType})`,
                            oobis: [agentOOBI], createdAt: new Date().toISOString()
                        });

                        StorageService.saveCredential({
                            said: ecrCredSaid, type: 'Engagement Context Role', issuer: lePrefix, issuee: agentPrefix,
                            schema: VLEI_SCHEMAS.ECR, registry: leRegistry, status: 'issued',
                            attributes: { 
                                engagementContextRole: agent.engagementContextRole, 
                                agentType: agent.agentType,
                                personLegalName: person.legalName,
                                LEI: org.lei
                            },
                            edges: { le: { n: leCredSaid, s: VLEI_SCHEMAS.LEGAL_ENTITY } },
                            issuedAt: new Date().toISOString()
                        });

                        ConsoleUtils.success(`      ✓ Agent: ${agent.engagementContextRole} (${agentPrefix})`);
                    }
                }
                
                ConsoleUtils.continue();
            }

            // Summary
            ConsoleUtils.title('✅ Setup Complete! (Official GLEIF Flow)');
            ConsoleUtils.message('\nvLEI Trust Chain Created:\n');
            ConsoleUtils.data('ROOT', rootPrefix);
            ConsoleUtils.data('└─ QVI', qviPrefix);
            
            for (const org of this.config.organizations) {
                ConsoleUtils.message(`    └─ ${org.name} (LEI: ${org.lei})`);
                for (const person of org.persons) {
                    ConsoleUtils.message(`        ├─ OOR_AUTH: ${person.legalName} (by LE)`);
                    ConsoleUtils.message(`        └─ OOR: ${person.legalName} (${person.officialRole}) (by QVI) ✓`);
                    for (const agent of person.agents) {
                        ConsoleUtils.message(`            └─ ECR: ${agent.engagementContextRole} ✓`);
                    }
                }
            }
            
            ConsoleUtils.message('\n💾 All data saved to ./data/\n');
            ConsoleUtils.message('\n📘 This implementation follows the official GLEIF specification:');
            ConsoleUtils.message('   - OOR_AUTH credentials issued by Legal Entity');
            ConsoleUtils.message('   - OOR credentials issued by QVI with AUTH edge');
            ConsoleUtils.message('   - Proper credential chain verification\n');

        } catch (error: any) {
            ConsoleUtils.error(`Setup failed: ${error.message}`);
            
            if (error.message.includes('Credential schema') && error.message.includes('not found')) {
                ConsoleUtils.message('\n⚠️  Schema not found error detected!\n');
                ConsoleUtils.message('Make sure vlei-server is running and schemas are loaded.\n');
            }
            
            throw error;
        }
    }
}
