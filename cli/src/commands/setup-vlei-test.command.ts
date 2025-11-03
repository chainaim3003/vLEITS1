import { randomPasscode } from 'signify-ts';
import { KERIAService } from '../services/keria.service';
import { StorageService } from '../services/storage.service';
import { ConsoleUtils } from '../utils/console.utils';
import { VLEI_SCHEMAS } from '../types/vlei.types';
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

            ConsoleUtils.message('ℹ️  Attempting setup without schema OOBI resolution (schemas may be pre-loaded in KERIA)\n');

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

            // STEP 2: Create QVI
            ConsoleUtils.section('📋 Step 2: Creating QVI');
            const { client: qviClient } = await KERIAService.createClient(randomPasscode());
            const qviPrefix = await KERIAService.createAID(qviClient, this.config.qvi.alias);
            await KERIAService.addAgentRole(qviClient, this.config.qvi.alias);
            const qviOOBI = await KERIAService.generateOOBI(qviClient, this.config.qvi.alias);
            const qviRegistry = await KERIAService.createRegistry(qviClient, this.config.qvi.alias, this.config.qvi.registryName);

            await KERIAService.resolveOOBI(rootClient, qviOOBI, 'QVI_Contact');
            await KERIAService.resolveOOBI(qviClient, rootOOBI, 'ROOT_Contact');

            try {
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
            } catch (error: any) {
                if (error.message.includes('Credential schema') && error.message.includes('not found')) {
                    ConsoleUtils.error('\\n❌ Schema Not Found Error');
                    ConsoleUtils.message('\\nThe vLEI schemas are not pre-loaded in KERIA.');
                    ConsoleUtils.message('\\n📋 Required Schemas:');
                    ConsoleUtils.message(`  • QVI: ${VLEI_SCHEMAS.QVI}`);
                    ConsoleUtils.message(`  • Legal Entity: ${VLEI_SCHEMAS.LEGAL_ENTITY}`);
                    ConsoleUtils.message(`  • OOR: ${VLEI_SCHEMAS.OOR}`);
                    ConsoleUtils.message(`  • ECR: ${VLEI_SCHEMAS.ECR}`);
                    ConsoleUtils.message('\\n💡 Solution Options:');
                    ConsoleUtils.message('  1. Load schemas into KERIA database directly');
                    ConsoleUtils.message('  2. Use a publicly accessible schema server');
                    ConsoleUtils.message('  3. Configure KERIA to allow localhost connections');
                    ConsoleUtils.message('\\nFor now, this setup cannot proceed without schema access.\\n');
                }
                throw error;
            }

            ConsoleUtils.continue();

            // ... rest of the code would go here for organizations
            
            ConsoleUtils.message('\\n⚠️  Stopping after QVI to test schema availability\\n');

        } catch (error: any) {
            ConsoleUtils.error(`Setup failed: ${error.message}`);
            throw error;
        }
    }
}
