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

export class SetupVLEICommand {
    private config: VLEIConfig;

    constructor() {
        const configPath = path.join(__dirname, '..', '..', 'config.json');
        const configData = fs.readFileSync(configPath, 'utf-8');
        this.config = JSON.parse(configData);
    }

    async execute(): Promise<void> {
        ConsoleUtils.title('🚀 vLEI Multi-Organization Setup');
        ConsoleUtils.message(`Creating vLEI trust chain for ${this.config.organizations.length} organization(s)...\n`);

        try {
            await KERIAService.initialize();

            // STEP 1: Create GLEIF ROOT first
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

            // STEP 1.5: Resolve vLEI Schema OOBIs using the ROOT client
            ConsoleUtils.section('📋 Step 1.5: Resolving vLEI Schema OOBIs');
            
            // Resolve all required schemas with the ROOT client that will issue credentials
            await KERIAService.resolveSchemaOOBI(
                rootClient, 
                VLEI_SCHEMA_CONFIG.SCHEMAS.QVI_VLEI.OOBI,
                VLEI_SCHEMA_CONFIG.SCHEMAS.QVI_VLEI.NAME
            );
            
            await KERIAService.resolveSchemaOOBI(
                rootClient,
                VLEI_SCHEMA_CONFIG.SCHEMAS.LEGAL_ENTITY_VLEI.OOBI,
                VLEI_SCHEMA_CONFIG.SCHEMAS.LEGAL_ENTITY_VLEI.NAME
            );
            
            await KERIAService.resolveSchemaOOBI(
                rootClient,
                VLEI_SCHEMA_CONFIG.SCHEMAS.ORG_ROLE_VLEI.OOBI,
                VLEI_SCHEMA_CONFIG.SCHEMAS.ORG_ROLE_VLEI.NAME
            );
            
            await KERIAService.resolveSchemaOOBI(
                rootClient,
                VLEI_SCHEMA_CONFIG.SCHEMAS.ECR_VLEI.OOBI,
                VLEI_SCHEMA_CONFIG.SCHEMAS.ECR_VLEI.NAME
            );
            
            ConsoleUtils.success('✓ All schema OOBIs resolved');
            ConsoleUtils.continue();

            // STEP 2: Create QVI
            ConsoleUtils.section('📋 Step 2: Creating QVI');
            const { client: qviClient } = await KERIAService.createClient(randomPasscode());
            const qviPrefix = await KERIAService.createAID(qviClient, this.config.qvi.alias);
            await KERIAService.addAgentRole(qviClient, this.config.qvi.alias);
            const qviOOBI = await KERIAService.generateOOBI(qviClient, this.config.qvi.alias);
            const qviRegistry = await KERIAService.createRegistry(qviClient, this.config.qvi.alias, this.config.qvi.registryName);

            await KERIAService.resolveOOBI(rootClient, qviOOBI, 'QVI_Contact');
            await KERIAService.resolveOOBI(qviClient, rootOOBI, 'ROOT_Contact');

            // Resolve schemas for QVI client (it will issue LE credentials)
            ConsoleUtils.section('  Resolving schemas for QVI');
            await KERIAService.resolveSchemaOOBI(qviClient, VLEI_SCHEMA_CONFIG.SCHEMAS.LEGAL_ENTITY_VLEI.OOBI, 'LE Schema');
            await KERIAService.resolveSchemaOOBI(qviClient, VLEI_SCHEMA_CONFIG.SCHEMAS.ORG_ROLE_VLEI.OOBI, 'OOR Schema');
            await KERIAService.resolveSchemaOOBI(qviClient, VLEI_SCHEMA_CONFIG.SCHEMAS.ECR_VLEI.OOBI, 'ECR Schema');

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

                await KERIAService.resolveOOBI(qviClient, leOOBI, `${org.id}_Contact`);
                await KERIAService.resolveOOBI(leClient, qviOOBI, 'QVI_Contact');

                // Resolve schemas for LE client (it will issue OOR and ECR credentials)
                ConsoleUtils.section('  Resolving schemas for LE');
                await KERIAService.resolveSchemaOOBI(leClient, VLEI_SCHEMA_CONFIG.SCHEMAS.ORG_ROLE_VLEI.OOBI, 'OOR Schema');
                await KERIAService.resolveSchemaOOBI(leClient, VLEI_SCHEMA_CONFIG.SCHEMAS.ECR_VLEI.OOBI, 'ECR Schema');

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

                // Create Persons and Agents for this organization
                for (const person of org.persons) {
                    ConsoleUtils.section(`  👤 Creating Person: ${person.legalName} (${person.officialRole})`);
                    
                    const { client: personClient } = await KERIAService.createClient(randomPasscode());
                    const personPrefix = await KERIAService.createAID(personClient, person.alias);
                    await KERIAService.addAgentRole(personClient, person.alias);
                    const personOOBI = await KERIAService.generateOOBI(personClient, person.alias);

                    await KERIAService.resolveOOBI(leClient, personOOBI, `${person.alias}_Contact`);
                    await KERIAService.resolveOOBI(personClient, leOOBI, `${org.id}_Contact`);

                    // Resolve ECR schema for person client (it will issue ECR credentials)
                    await KERIAService.resolveSchemaOOBI(personClient, VLEI_SCHEMA_CONFIG.SCHEMAS.ECR_VLEI.OOBI, 'ECR Schema');

                    const { said: oorCredSaid, credential: oorCred } = await KERIAService.issueCredential(
                        leClient, org.alias, leRegistry, VLEI_SCHEMAS.OOR, personPrefix,
                        { 
                            LEI: org.lei, 
                            personLegalName: person.legalName, 
                            officialRole: person.officialRole, 
                            dt: new Date().toISOString() 
                        },
                        { d: '', le: { n: leCredSaid, s: VLEI_SCHEMAS.LEGAL_ENTITY } }
                    );
                    await KERIAService.grantCredential(leClient, org.alias, personPrefix, oorCred);
                    const oorGrantNotif = await KERIAService.waitForGrantNotification(personClient);
                    await KERIAService.admitCredential(personClient, person.alias, lePrefix, oorGrantNotif.a.d);
                    await KERIAService.markNotificationRead(personClient, oorGrantNotif.i);

                    StorageService.saveIdentity({
                        alias: person.alias, prefix: personPrefix, type: 'person', 
                        role: person.officialRole, oobis: [personOOBI], createdAt: new Date().toISOString()
                    });

                    StorageService.saveCredential({
                        said: oorCredSaid, type: 'Official Organizational Role', issuer: lePrefix, issuee: personPrefix,
                        schema: VLEI_SCHEMAS.OOR, registry: leRegistry, status: 'issued',
                        attributes: { personLegalName: person.legalName, officialRole: person.officialRole },
                        edges: { le: { n: leCredSaid, s: VLEI_SCHEMAS.LEGAL_ENTITY } },
                        issuedAt: new Date().toISOString()
                    });

                    ConsoleUtils.success(`  ✓ Person: ${person.legalName} (${personPrefix})`);

                    // Create Agents for this person
                    for (const agent of person.agents) {
                        ConsoleUtils.section(`    🤖 Creating Agent: ${agent.engagementContextRole}`);
                        
                        const { client: agentClient } = await KERIAService.createClient(randomPasscode());
                        const agentPrefix = await KERIAService.createAID(agentClient, agent.alias);
                        await KERIAService.addAgentRole(agentClient, agent.alias);
                        const agentOOBI = await KERIAService.generateOOBI(agentClient, agent.alias);

                        await KERIAService.resolveOOBI(personClient, agentOOBI, `${agent.alias}_Contact`);
                        await KERIAService.resolveOOBI(agentClient, personOOBI, `${person.alias}_Contact`);

                        const { said: ecrCredSaid, credential: ecrCred } = await KERIAService.issueCredential(
                            personClient, person.alias, leRegistry, VLEI_SCHEMAS.ECR, agentPrefix,
                            { 
                                LEI: org.lei, 
                                personLegalName: person.legalName, 
                                engagementContextRole: agent.engagementContextRole, 
                                agentType: agent.agentType, 
                                dt: new Date().toISOString() 
                            },
                            { d: '', oor: { n: oorCredSaid, s: VLEI_SCHEMAS.OOR } }
                        );
                        await KERIAService.grantCredential(personClient, person.alias, agentPrefix, ecrCred);
                        const ecrGrantNotif = await KERIAService.waitForGrantNotification(agentClient);
                        await KERIAService.admitCredential(agentClient, agent.alias, personPrefix, ecrGrantNotif.a.d);
                        await KERIAService.markNotificationRead(agentClient, ecrGrantNotif.i);

                        StorageService.saveIdentity({
                            alias: agent.alias, prefix: agentPrefix, type: 'agent', 
                            role: `${agent.engagementContextRole} (${agent.agentType})`,
                            oobis: [agentOOBI], createdAt: new Date().toISOString()
                        });

                        StorageService.saveCredential({
                            said: ecrCredSaid, type: 'Engagement Context Role', issuer: personPrefix, issuee: agentPrefix,
                            schema: VLEI_SCHEMAS.ECR, registry: leRegistry, status: 'issued',
                            attributes: { engagementContextRole: agent.engagementContextRole, agentType: agent.agentType },
                            edges: { oor: { n: oorCredSaid, s: VLEI_SCHEMAS.OOR } },
                            issuedAt: new Date().toISOString()
                        });

                        ConsoleUtils.success(`    ✓ Agent: ${agent.engagementContextRole} (${agentPrefix})`);
                    }
                }
                
                ConsoleUtils.continue();
            }

            // Summary
            ConsoleUtils.title('✅ Setup Complete!');
            ConsoleUtils.message('\nvLEI Trust Chain Created:\n');
            ConsoleUtils.data('ROOT', rootPrefix);
            ConsoleUtils.data('└─ QVI', qviPrefix);
            
            for (const org of this.config.organizations) {
                ConsoleUtils.message(`    └─ ${org.name} (LEI: ${org.lei})`);
                for (const person of org.persons) {
                    ConsoleUtils.message(`        └─ ${person.legalName} (${person.officialRole})`);
                    for (const agent of person.agents) {
                        ConsoleUtils.message(`            └─ ${agent.engagementContextRole} ✓`);
                    }
                }
            }
            
            ConsoleUtils.message('\n💾 All data saved to ./data/\n');

        } catch (error: any) {
            ConsoleUtils.error(`Setup failed: ${error.message}`);
            
            if (error.message.includes('Credential schema') && error.message.includes('not found')) {
                ConsoleUtils.message('\n⚠️  Schema not found error detected!\n');
                ConsoleUtils.message('This means KERIA doesn\'t have the vLEI schemas pre-loaded.');
                ConsoleUtils.message('You have two options:\n');
                ConsoleUtils.message('1. Set up a local schema server (vlei-server)');
                ConsoleUtils.message('2. Use KERIA with pre-configured schemas');
                ConsoleUtils.message('\nFor now, the schemas might need to be loaded into KERIA first.\n');
            }
            
            throw error;
        }
    }
}
