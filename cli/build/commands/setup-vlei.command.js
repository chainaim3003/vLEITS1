"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupVLEICommand = void 0;
const signify_ts_1 = require("signify-ts");
const keria_service_1 = require("../services/keria.service");
const storage_service_1 = require("../services/storage.service");
const console_utils_1 = require("../utils/console.utils");
const vlei_types_1 = require("../types/vlei.types");
const vlei_schemas_config_1 = require("../config/vlei-schemas.config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class SetupVLEICommand {
    constructor() {
        const configPath = path.join(__dirname, '..', '..', 'config.json');
        const configData = fs.readFileSync(configPath, 'utf-8');
        this.config = JSON.parse(configData);
    }
    async execute() {
        console_utils_1.ConsoleUtils.title('🚀 vLEI Multi-Organization Setup');
        console_utils_1.ConsoleUtils.message(`Creating vLEI trust chain for ${this.config.organizations.length} organization(s)...\n`);
        try {
            await keria_service_1.KERIAService.initialize();
            // STEP 1: Create GLEIF ROOT first
            console_utils_1.ConsoleUtils.section('📋 Step 1: Creating GLEIF ROOT');
            const { client: rootClient } = await keria_service_1.KERIAService.createClient((0, signify_ts_1.randomPasscode)());
            const rootPrefix = await keria_service_1.KERIAService.createAID(rootClient, this.config.root.alias);
            await keria_service_1.KERIAService.addAgentRole(rootClient, this.config.root.alias);
            const rootOOBI = await keria_service_1.KERIAService.generateOOBI(rootClient, this.config.root.alias);
            const rootRegistry = await keria_service_1.KERIAService.createRegistry(rootClient, this.config.root.alias, this.config.root.registryName);
            storage_service_1.StorageService.saveIdentity({
                alias: this.config.root.alias, prefix: rootPrefix, type: 'root',
                registry: rootRegistry, oobis: [rootOOBI], createdAt: new Date().toISOString()
            });
            console_utils_1.ConsoleUtils.success(`✓ GLEIF ROOT: ${rootPrefix}`);
            console_utils_1.ConsoleUtils.continue();
            // STEP 1.5: Resolve vLEI Schema OOBIs using the ROOT client
            console_utils_1.ConsoleUtils.section('📋 Step 1.5: Resolving vLEI Schema OOBIs');
            // Resolve all required schemas with the ROOT client that will issue credentials
            await keria_service_1.KERIAService.resolveSchemaOOBI(rootClient, vlei_schemas_config_1.VLEI_SCHEMA_CONFIG.SCHEMAS.QVI_VLEI.OOBI, vlei_schemas_config_1.VLEI_SCHEMA_CONFIG.SCHEMAS.QVI_VLEI.NAME);
            await keria_service_1.KERIAService.resolveSchemaOOBI(rootClient, vlei_schemas_config_1.VLEI_SCHEMA_CONFIG.SCHEMAS.LEGAL_ENTITY_VLEI.OOBI, vlei_schemas_config_1.VLEI_SCHEMA_CONFIG.SCHEMAS.LEGAL_ENTITY_VLEI.NAME);
            await keria_service_1.KERIAService.resolveSchemaOOBI(rootClient, vlei_schemas_config_1.VLEI_SCHEMA_CONFIG.SCHEMAS.ORG_ROLE_VLEI.OOBI, vlei_schemas_config_1.VLEI_SCHEMA_CONFIG.SCHEMAS.ORG_ROLE_VLEI.NAME);
            await keria_service_1.KERIAService.resolveSchemaOOBI(rootClient, vlei_schemas_config_1.VLEI_SCHEMA_CONFIG.SCHEMAS.ECR_VLEI.OOBI, vlei_schemas_config_1.VLEI_SCHEMA_CONFIG.SCHEMAS.ECR_VLEI.NAME);
            console_utils_1.ConsoleUtils.success('✓ All schema OOBIs resolved');
            console_utils_1.ConsoleUtils.continue();
            // STEP 2: Create QVI
            console_utils_1.ConsoleUtils.section('📋 Step 2: Creating QVI');
            const { client: qviClient } = await keria_service_1.KERIAService.createClient((0, signify_ts_1.randomPasscode)());
            const qviPrefix = await keria_service_1.KERIAService.createAID(qviClient, this.config.qvi.alias);
            await keria_service_1.KERIAService.addAgentRole(qviClient, this.config.qvi.alias);
            const qviOOBI = await keria_service_1.KERIAService.generateOOBI(qviClient, this.config.qvi.alias);
            const qviRegistry = await keria_service_1.KERIAService.createRegistry(qviClient, this.config.qvi.alias, this.config.qvi.registryName);
            await keria_service_1.KERIAService.resolveOOBI(rootClient, qviOOBI, 'QVI_Contact');
            await keria_service_1.KERIAService.resolveOOBI(qviClient, rootOOBI, 'ROOT_Contact');
            // Resolve schemas for QVI client (it will issue LE credentials)
            console_utils_1.ConsoleUtils.section('  Resolving schemas for QVI');
            await keria_service_1.KERIAService.resolveSchemaOOBI(qviClient, vlei_schemas_config_1.VLEI_SCHEMA_CONFIG.SCHEMAS.LEGAL_ENTITY_VLEI.OOBI, 'LE Schema');
            await keria_service_1.KERIAService.resolveSchemaOOBI(qviClient, vlei_schemas_config_1.VLEI_SCHEMA_CONFIG.SCHEMAS.ORG_ROLE_VLEI.OOBI, 'OOR Schema');
            await keria_service_1.KERIAService.resolveSchemaOOBI(qviClient, vlei_schemas_config_1.VLEI_SCHEMA_CONFIG.SCHEMAS.ECR_VLEI.OOBI, 'ECR Schema');
            const { said: qviCredSaid, credential: qviCred } = await keria_service_1.KERIAService.issueCredential(rootClient, this.config.root.alias, rootRegistry, vlei_types_1.VLEI_SCHEMAS.QVI, qviPrefix, { LEI: this.config.qvi.lei, dt: new Date().toISOString() });
            await keria_service_1.KERIAService.grantCredential(rootClient, this.config.root.alias, qviPrefix, qviCred);
            const qviGrantNotif = await keria_service_1.KERIAService.waitForGrantNotification(qviClient);
            await keria_service_1.KERIAService.admitCredential(qviClient, this.config.qvi.alias, rootPrefix, qviGrantNotif.a.d);
            await keria_service_1.KERIAService.markNotificationRead(qviClient, qviGrantNotif.i);
            storage_service_1.StorageService.saveIdentity({
                alias: this.config.qvi.alias, prefix: qviPrefix, lei: this.config.qvi.lei,
                type: 'qvi', registry: qviRegistry, oobis: [qviOOBI], createdAt: new Date().toISOString()
            });
            storage_service_1.StorageService.saveCredential({
                said: qviCredSaid, type: 'QVI', issuer: rootPrefix, issuee: qviPrefix,
                schema: vlei_types_1.VLEI_SCHEMAS.QVI, registry: rootRegistry, status: 'issued',
                lei: this.config.qvi.lei, attributes: { LEI: this.config.qvi.lei },
                issuedAt: new Date().toISOString()
            });
            console_utils_1.ConsoleUtils.success(`✓ QVI: ${qviPrefix}`);
            console_utils_1.ConsoleUtils.continue();
            // STEP 3+: Create Organizations, Persons, and Agents
            let stepNumber = 3;
            for (const org of this.config.organizations) {
                console_utils_1.ConsoleUtils.section(`📋 Step ${stepNumber}: Creating Organization: ${org.name}`);
                // Create Legal Entity
                const { client: leClient } = await keria_service_1.KERIAService.createClient((0, signify_ts_1.randomPasscode)());
                const lePrefix = await keria_service_1.KERIAService.createAID(leClient, org.alias);
                await keria_service_1.KERIAService.addAgentRole(leClient, org.alias);
                const leOOBI = await keria_service_1.KERIAService.generateOOBI(leClient, org.alias);
                const leRegistry = await keria_service_1.KERIAService.createRegistry(leClient, org.alias, org.registryName);
                await keria_service_1.KERIAService.resolveOOBI(qviClient, leOOBI, `${org.id}_Contact`);
                await keria_service_1.KERIAService.resolveOOBI(leClient, qviOOBI, 'QVI_Contact');
                // Resolve schemas for LE client (it will issue OOR and ECR credentials)
                console_utils_1.ConsoleUtils.section('  Resolving schemas for LE');
                await keria_service_1.KERIAService.resolveSchemaOOBI(leClient, vlei_schemas_config_1.VLEI_SCHEMA_CONFIG.SCHEMAS.ORG_ROLE_VLEI.OOBI, 'OOR Schema');
                await keria_service_1.KERIAService.resolveSchemaOOBI(leClient, vlei_schemas_config_1.VLEI_SCHEMA_CONFIG.SCHEMAS.ECR_VLEI.OOBI, 'ECR Schema');
                const { said: leCredSaid, credential: leCred } = await keria_service_1.KERIAService.issueCredential(qviClient, this.config.qvi.alias, qviRegistry, vlei_types_1.VLEI_SCHEMAS.LEGAL_ENTITY, lePrefix, { LEI: org.lei, dt: new Date().toISOString() }, { d: '', qvi: { n: qviCredSaid, s: vlei_types_1.VLEI_SCHEMAS.QVI } });
                await keria_service_1.KERIAService.grantCredential(qviClient, this.config.qvi.alias, lePrefix, leCred);
                const leGrantNotif = await keria_service_1.KERIAService.waitForGrantNotification(leClient);
                await keria_service_1.KERIAService.admitCredential(leClient, org.alias, qviPrefix, leGrantNotif.a.d);
                await keria_service_1.KERIAService.markNotificationRead(leClient, leGrantNotif.i);
                storage_service_1.StorageService.saveIdentity({
                    alias: org.alias, prefix: lePrefix, lei: org.lei,
                    type: 'legal-entity', registry: leRegistry, oobis: [leOOBI], createdAt: new Date().toISOString()
                });
                storage_service_1.StorageService.saveCredential({
                    said: leCredSaid, type: 'Legal Entity vLEI', issuer: qviPrefix, issuee: lePrefix,
                    schema: vlei_types_1.VLEI_SCHEMAS.LEGAL_ENTITY, registry: qviRegistry, status: 'issued',
                    lei: org.lei, attributes: { LEI: org.lei },
                    edges: { qvi: { n: qviCredSaid, s: vlei_types_1.VLEI_SCHEMAS.QVI } },
                    issuedAt: new Date().toISOString()
                });
                console_utils_1.ConsoleUtils.success(`✓ Legal Entity: ${org.name} (${lePrefix})`);
                stepNumber++;
                // Create Persons and Agents for this organization
                for (const person of org.persons) {
                    console_utils_1.ConsoleUtils.section(`  👤 Creating Person: ${person.legalName} (${person.officialRole})`);
                    const { client: personClient } = await keria_service_1.KERIAService.createClient((0, signify_ts_1.randomPasscode)());
                    const personPrefix = await keria_service_1.KERIAService.createAID(personClient, person.alias);
                    await keria_service_1.KERIAService.addAgentRole(personClient, person.alias);
                    const personOOBI = await keria_service_1.KERIAService.generateOOBI(personClient, person.alias);
                    await keria_service_1.KERIAService.resolveOOBI(leClient, personOOBI, `${person.alias}_Contact`);
                    await keria_service_1.KERIAService.resolveOOBI(personClient, leOOBI, `${org.id}_Contact`);
                    // Resolve ECR schema for person client (it will issue ECR credentials)
                    await keria_service_1.KERIAService.resolveSchemaOOBI(personClient, vlei_schemas_config_1.VLEI_SCHEMA_CONFIG.SCHEMAS.ECR_VLEI.OOBI, 'ECR Schema');
                    const { said: oorCredSaid, credential: oorCred } = await keria_service_1.KERIAService.issueCredential(leClient, org.alias, leRegistry, vlei_types_1.VLEI_SCHEMAS.OOR, personPrefix, {
                        LEI: org.lei,
                        personLegalName: person.legalName,
                        officialRole: person.officialRole,
                        dt: new Date().toISOString()
                    }, { d: '', le: { n: leCredSaid, s: vlei_types_1.VLEI_SCHEMAS.LEGAL_ENTITY } });
                    await keria_service_1.KERIAService.grantCredential(leClient, org.alias, personPrefix, oorCred);
                    const oorGrantNotif = await keria_service_1.KERIAService.waitForGrantNotification(personClient);
                    await keria_service_1.KERIAService.admitCredential(personClient, person.alias, lePrefix, oorGrantNotif.a.d);
                    await keria_service_1.KERIAService.markNotificationRead(personClient, oorGrantNotif.i);
                    storage_service_1.StorageService.saveIdentity({
                        alias: person.alias, prefix: personPrefix, type: 'person',
                        role: person.officialRole, oobis: [personOOBI], createdAt: new Date().toISOString()
                    });
                    storage_service_1.StorageService.saveCredential({
                        said: oorCredSaid, type: 'Official Organizational Role', issuer: lePrefix, issuee: personPrefix,
                        schema: vlei_types_1.VLEI_SCHEMAS.OOR, registry: leRegistry, status: 'issued',
                        attributes: { personLegalName: person.legalName, officialRole: person.officialRole },
                        edges: { le: { n: leCredSaid, s: vlei_types_1.VLEI_SCHEMAS.LEGAL_ENTITY } },
                        issuedAt: new Date().toISOString()
                    });
                    console_utils_1.ConsoleUtils.success(`  ✓ Person: ${person.legalName} (${personPrefix})`);
                    // Create Agents for this person
                    for (const agent of person.agents) {
                        console_utils_1.ConsoleUtils.section(`    🤖 Creating Agent: ${agent.engagementContextRole}`);
                        const { client: agentClient } = await keria_service_1.KERIAService.createClient((0, signify_ts_1.randomPasscode)());
                        const agentPrefix = await keria_service_1.KERIAService.createAID(agentClient, agent.alias);
                        await keria_service_1.KERIAService.addAgentRole(agentClient, agent.alias);
                        const agentOOBI = await keria_service_1.KERIAService.generateOOBI(agentClient, agent.alias);
                        await keria_service_1.KERIAService.resolveOOBI(personClient, agentOOBI, `${agent.alias}_Contact`);
                        await keria_service_1.KERIAService.resolveOOBI(agentClient, personOOBI, `${person.alias}_Contact`);
                        const { said: ecrCredSaid, credential: ecrCred } = await keria_service_1.KERIAService.issueCredential(personClient, person.alias, leRegistry, vlei_types_1.VLEI_SCHEMAS.ECR, agentPrefix, {
                            LEI: org.lei,
                            personLegalName: person.legalName,
                            engagementContextRole: agent.engagementContextRole,
                            agentType: agent.agentType,
                            dt: new Date().toISOString()
                        }, { d: '', oor: { n: oorCredSaid, s: vlei_types_1.VLEI_SCHEMAS.OOR } });
                        await keria_service_1.KERIAService.grantCredential(personClient, person.alias, agentPrefix, ecrCred);
                        const ecrGrantNotif = await keria_service_1.KERIAService.waitForGrantNotification(agentClient);
                        await keria_service_1.KERIAService.admitCredential(agentClient, agent.alias, personPrefix, ecrGrantNotif.a.d);
                        await keria_service_1.KERIAService.markNotificationRead(agentClient, ecrGrantNotif.i);
                        storage_service_1.StorageService.saveIdentity({
                            alias: agent.alias, prefix: agentPrefix, type: 'agent',
                            role: `${agent.engagementContextRole} (${agent.agentType})`,
                            oobis: [agentOOBI], createdAt: new Date().toISOString()
                        });
                        storage_service_1.StorageService.saveCredential({
                            said: ecrCredSaid, type: 'Engagement Context Role', issuer: personPrefix, issuee: agentPrefix,
                            schema: vlei_types_1.VLEI_SCHEMAS.ECR, registry: leRegistry, status: 'issued',
                            attributes: { engagementContextRole: agent.engagementContextRole, agentType: agent.agentType },
                            edges: { oor: { n: oorCredSaid, s: vlei_types_1.VLEI_SCHEMAS.OOR } },
                            issuedAt: new Date().toISOString()
                        });
                        console_utils_1.ConsoleUtils.success(`    ✓ Agent: ${agent.engagementContextRole} (${agentPrefix})`);
                    }
                }
                console_utils_1.ConsoleUtils.continue();
            }
            // Summary
            console_utils_1.ConsoleUtils.title('✅ Setup Complete!');
            console_utils_1.ConsoleUtils.message('\nvLEI Trust Chain Created:\n');
            console_utils_1.ConsoleUtils.data('ROOT', rootPrefix);
            console_utils_1.ConsoleUtils.data('└─ QVI', qviPrefix);
            for (const org of this.config.organizations) {
                console_utils_1.ConsoleUtils.message(`    └─ ${org.name} (LEI: ${org.lei})`);
                for (const person of org.persons) {
                    console_utils_1.ConsoleUtils.message(`        └─ ${person.legalName} (${person.officialRole})`);
                    for (const agent of person.agents) {
                        console_utils_1.ConsoleUtils.message(`            └─ ${agent.engagementContextRole} ✓`);
                    }
                }
            }
            console_utils_1.ConsoleUtils.message('\n💾 All data saved to ./data/\n');
        }
        catch (error) {
            console_utils_1.ConsoleUtils.error(`Setup failed: ${error.message}`);
            if (error.message.includes('Credential schema') && error.message.includes('not found')) {
                console_utils_1.ConsoleUtils.message('\n⚠️  Schema not found error detected!\n');
                console_utils_1.ConsoleUtils.message('This means KERIA doesn\'t have the vLEI schemas pre-loaded.');
                console_utils_1.ConsoleUtils.message('You have two options:\n');
                console_utils_1.ConsoleUtils.message('1. Set up a local schema server (vlei-server)');
                console_utils_1.ConsoleUtils.message('2. Use KERIA with pre-configured schemas');
                console_utils_1.ConsoleUtils.message('\nFor now, the schemas might need to be loaded into KERIA first.\n');
            }
            throw error;
        }
    }
}
exports.SetupVLEICommand = SetupVLEICommand;
//# sourceMappingURL=setup-vlei.command.js.map