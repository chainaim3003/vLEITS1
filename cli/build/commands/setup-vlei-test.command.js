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
            console_utils_1.ConsoleUtils.message('ℹ️  Attempting setup without schema OOBI resolution (schemas may be pre-loaded in KERIA)\n');
            // STEP 1: Create GLEIF ROOT
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
            // STEP 2: Create QVI
            console_utils_1.ConsoleUtils.section('📋 Step 2: Creating QVI');
            const { client: qviClient } = await keria_service_1.KERIAService.createClient((0, signify_ts_1.randomPasscode)());
            const qviPrefix = await keria_service_1.KERIAService.createAID(qviClient, this.config.qvi.alias);
            await keria_service_1.KERIAService.addAgentRole(qviClient, this.config.qvi.alias);
            const qviOOBI = await keria_service_1.KERIAService.generateOOBI(qviClient, this.config.qvi.alias);
            const qviRegistry = await keria_service_1.KERIAService.createRegistry(qviClient, this.config.qvi.alias, this.config.qvi.registryName);
            await keria_service_1.KERIAService.resolveOOBI(rootClient, qviOOBI, 'QVI_Contact');
            await keria_service_1.KERIAService.resolveOOBI(qviClient, rootOOBI, 'ROOT_Contact');
            try {
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
            }
            catch (error) {
                if (error.message.includes('Credential schema') && error.message.includes('not found')) {
                    console_utils_1.ConsoleUtils.error('\\n❌ Schema Not Found Error');
                    console_utils_1.ConsoleUtils.message('\\nThe vLEI schemas are not pre-loaded in KERIA.');
                    console_utils_1.ConsoleUtils.message('\\n📋 Required Schemas:');
                    console_utils_1.ConsoleUtils.message(`  • QVI: ${vlei_types_1.VLEI_SCHEMAS.QVI}`);
                    console_utils_1.ConsoleUtils.message(`  • Legal Entity: ${vlei_types_1.VLEI_SCHEMAS.LEGAL_ENTITY}`);
                    console_utils_1.ConsoleUtils.message(`  • OOR: ${vlei_types_1.VLEI_SCHEMAS.OOR}`);
                    console_utils_1.ConsoleUtils.message(`  • ECR: ${vlei_types_1.VLEI_SCHEMAS.ECR}`);
                    console_utils_1.ConsoleUtils.message('\\n💡 Solution Options:');
                    console_utils_1.ConsoleUtils.message('  1. Load schemas into KERIA database directly');
                    console_utils_1.ConsoleUtils.message('  2. Use a publicly accessible schema server');
                    console_utils_1.ConsoleUtils.message('  3. Configure KERIA to allow localhost connections');
                    console_utils_1.ConsoleUtils.message('\\nFor now, this setup cannot proceed without schema access.\\n');
                }
                throw error;
            }
            console_utils_1.ConsoleUtils.continue();
            // ... rest of the code would go here for organizations
            console_utils_1.ConsoleUtils.message('\\n⚠️  Stopping after QVI to test schema availability\\n');
        }
        catch (error) {
            console_utils_1.ConsoleUtils.error(`Setup failed: ${error.message}`);
            throw error;
        }
    }
}
exports.SetupVLEICommand = SetupVLEICommand;
//# sourceMappingURL=setup-vlei-test.command.js.map