"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KERIAService = void 0;
const signify_ts_1 = require("signify-ts");
const console_utils_1 = require("../utils/console.utils");
const vlei_rules_config_1 = require("../config/vlei-rules.config");
class KERIAService {
    static async initialize() {
        await (0, signify_ts_1.ready)();
        console_utils_1.ConsoleUtils.success('Signify-TS library initialized');
    }
    static async createClient(bran) {
        const client = new signify_ts_1.SignifyClient(this.ADMIN_URL, bran, signify_ts_1.Tier.low, this.BOOT_URL);
        await client.boot();
        await client.connect();
        const state = await client.state();
        return { client, state };
    }
    static async createAID(client, alias, identifierArgs = this.DEFAULT_IDENTIFIER_ARGS) {
        console_utils_1.ConsoleUtils.startSpinner(`Creating AID: ${alias}`);
        const inceptionResult = await client.identifiers().create(alias, identifierArgs);
        const operation = await inceptionResult.op();
        const completed = await client.operations().wait(operation, { signal: AbortSignal.timeout(this.TIMEOUT_MS) });
        if (completed.error)
            throw new Error(`AID creation failed: ${JSON.stringify(completed.error)}`);
        const aidPrefix = completed.response?.i;
        await client.operations().delete(completed.name);
        console_utils_1.ConsoleUtils.succeedSpinner(`Created AID: ${alias} (${aidPrefix})`);
        return aidPrefix;
    }
    static async addAgentRole(client, aidAlias) {
        if (!client.agent?.pre)
            throw new Error('Client agent prefix not available');
        console_utils_1.ConsoleUtils.startSpinner(`Adding agent role for ${aidAlias}`);
        const addRoleResult = await client.identifiers().addEndRole(aidAlias, this.ROLE_AGENT, client.agent.pre);
        const operation = await addRoleResult.op();
        const completed = await client.operations().wait(operation, { signal: AbortSignal.timeout(this.TIMEOUT_MS) });
        await client.operations().delete(completed.name);
        console_utils_1.ConsoleUtils.succeedSpinner(`Agent role added for ${aidAlias}`);
    }
    static async generateOOBI(client, aidAlias) {
        const oobiResult = await client.oobis().get(aidAlias, this.ROLE_AGENT);
        if (!oobiResult?.oobis?.length)
            throw new Error('No OOBI URL generated');
        return oobiResult.oobis[0];
    }
    static async resolveOOBI(client, oobiUrl, contactAlias) {
        console_utils_1.ConsoleUtils.startSpinner(`Resolving OOBI for ${contactAlias}`);
        const operation = await client.oobis().resolve(oobiUrl, contactAlias);
        const completed = await client.operations().wait(operation, { signal: AbortSignal.timeout(this.TIMEOUT_MS) });
        if (completed.error)
            throw new Error(`OOBI resolution failed: ${JSON.stringify(completed.error)}`);
        await client.operations().delete(completed.name);
        console_utils_1.ConsoleUtils.succeedSpinner(`OOBI resolved for ${contactAlias}`);
    }
    static async resolveSchemaOOBI(client, schemaOobiUrl, schemaName) {
        console_utils_1.ConsoleUtils.startSpinner(`Resolving schema OOBI: ${schemaName}`);
        try {
            const operation = await client.oobis().resolve(schemaOobiUrl, schemaName);
            const completed = await client.operations().wait(operation, { signal: AbortSignal.timeout(this.TIMEOUT_MS) });
            if (completed.error)
                throw new Error(`Schema OOBI resolution failed: ${JSON.stringify(completed.error)}`);
            await client.operations().delete(completed.name);
            console_utils_1.ConsoleUtils.succeedSpinner(`Schema OOBI resolved: ${schemaName}`);
        }
        catch (error) {
            console_utils_1.ConsoleUtils.failSpinner(`Schema OOBI resolution failed: ${schemaName}`);
            console.error(`\nError details:`);
            console.error(`  URL: ${schemaOobiUrl}`);
            console.error(`  Schema: ${schemaName}`);
            console.error(`  Error: ${error.message}`);
            if (error.cause)
                console.error(`  Cause: ${error.cause}`);
            throw error;
        }
    }
    static async createRegistry(client, aidAlias, registryName) {
        console_utils_1.ConsoleUtils.startSpinner(`Creating registry: ${registryName}`);
        const createResult = await client.registries().create({ name: aidAlias, registryName });
        const operation = await createResult.op();
        const completed = await client.operations().wait(operation, { signal: AbortSignal.timeout(this.TIMEOUT_MS) });
        if (completed.error)
            throw new Error(`Registry creation failed: ${JSON.stringify(completed.error)}`);
        const registrySaid = completed.response?.anchor?.i;
        await client.operations().delete(completed.name);
        console_utils_1.ConsoleUtils.succeedSpinner(`Registry created: ${registrySaid}`);
        return registrySaid;
    }
    static async issueCredential(client, issuerAidAlias, registryIdentifier, schemaSaid, holderAidPrefix, credentialAttributes, edges, rules) {
        console_utils_1.ConsoleUtils.startSpinner(`Issuing credential from ${issuerAidAlias}`);
        try {
            console.log(`\n[DEBUG] Starting credential issuance:`);
            console.log(`  Issuer: ${issuerAidAlias}`);
            console.log(`  Registry: ${registryIdentifier}`);
            console.log(`  Schema: ${schemaSaid}`);
            console.log(`  Holder: ${holderAidPrefix}`);
            // Build credential payload
            const credentialPayload = {
                ri: registryIdentifier,
                s: schemaSaid,
                u: new signify_ts_1.Salter({}).qb64,
                a: { i: holderAidPrefix, ...credentialAttributes }
            };
            // Add edges if provided
            if (edges) {
                console.log(`[DEBUG] SAIDifying edges...`);
                const saidifiedEdges = signify_ts_1.Saider.saidify({ d: '', ...edges })[1];
                credentialPayload.e = saidifiedEdges;
                console.log(`[DEBUG] Edges SAIDified: ${saidifiedEdges.d}`);
            }
            // Add rules
            console.log(`[DEBUG] SAIDifying rules...`);
            const rulesToUse = rules || vlei_rules_config_1.VLEI_RULES.STANDARD_RULES;
            const saidifiedRules = signify_ts_1.Saider.saidify({ d: '', ...rulesToUse })[1];
            credentialPayload.r = saidifiedRules;
            console.log(`[DEBUG] Rules SAIDified: ${saidifiedRules.d}`);
            // Issue credential
            console.log(`[DEBUG] Issuing credential...`);
            const issueResult = await client.credentials().issue(issuerAidAlias, credentialPayload);
            const operation = await issueResult.op;
            console.log(`[DEBUG] Operation: ${operation.name}`);
            // Simple wait like official training
            let completed;
            try {
                completed = await client.operations().wait(operation, { signal: AbortSignal.timeout(this.TIMEOUT_MS) });
                console.log(`[DEBUG] Operation completed normally`);
            }
            catch (error) {
                console.log(`[DEBUG] Wait timed out, checking metadata...`);
                // Fallback: check if credential exists in metadata
                completed = await client.operations().get(operation.name);
                if (!completed.metadata?.ced?.d) {
                    throw new Error(`Credential issuance failed: ${error.message}`);
                }
                console.log(`[DEBUG] Credential found in metadata despite timeout`);
            }
            if (completed.error) {
                throw new Error(`Credential issuance failed: ${JSON.stringify(completed.error)}`);
            }
            // Get SAID from response OR metadata
            const credentialSaid = completed.response?.ced?.d || completed.metadata?.ced?.d;
            if (!credentialSaid) {
                throw new Error('Credential SAID not found');
            }
            console.log(`[DEBUG] Credential SAID: ${credentialSaid}`);
            if (!completed.done) {
                console.log(`[WARN] Witnesses have not responded - credential valid but not fully witnessed yet`);
            }
            // Retrieve the full credential from client store (following official pattern)
            // With retry logic to handle witness timing issues
            let credential;
            const maxRetries = 10;
            const retryDelay = 2000; // 2 seconds between retries
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    if (attempt > 0) {
                        console.log(`[DEBUG] Retry ${attempt}/${maxRetries - 1} - waiting ${retryDelay}ms...`);
                        await (0, console_utils_1.sleep)(retryDelay);
                    }
                    else {
                        await (0, console_utils_1.sleep)(1000); // Initial wait
                    }
                    credential = await client.credentials().get(credentialSaid);
                    console.log(`[DEBUG] Credential retrieved from client store${attempt > 0 ? ` on retry ${attempt}` : ''}`);
                    break; // Success!
                }
                catch (error) {
                    if (attempt === maxRetries - 1) {
                        // Last attempt failed
                        throw new Error(`Credential not available after ${maxRetries} attempts. ` +
                            `Witnesses may be down or slow. Error: ${error.message}`);
                    }
                    console.log(`[DEBUG] Attempt ${attempt + 1} failed: ${error.message}`);
                }
            }
            if (!credential) {
                throw new Error('Credential retrieval failed');
            }
            console.log(`[DEBUG] Credential structure:`);
            console.log(`[DEBUG]   - has sad: ${!!credential.sad}`);
            console.log(`[DEBUG]   - has iss: ${!!credential.iss}`);
            console.log(`[DEBUG]   - has anc: ${!!credential.anc}`);
            console.log(`[DEBUG]   - has ancatc: ${!!credential.ancatc}`);
            await client.operations().delete(completed.name);
            console_utils_1.ConsoleUtils.succeedSpinner(`Credential issued: ${credentialSaid}`);
            return { said: credentialSaid, credential };
        }
        catch (error) {
            console_utils_1.ConsoleUtils.failSpinner(`Credential issuance failed`);
            console.error(`\n[ERROR] ${error.message}`);
            throw error;
        }
    }
    static async grantCredential(client, senderAidAlias, recipientAidPrefix, acdc) {
        console_utils_1.ConsoleUtils.startSpinner(`Granting credential via IPEX`);
        try {
            // Validate that all required fields are present
            if (!acdc) {
                throw new Error('Credential object is undefined');
            }
            if (!acdc.sad) {
                throw new Error('Credential.sad is undefined');
            }
            if (!acdc.iss) {
                throw new Error('Credential.iss is undefined');
            }
            if (!acdc.anc) {
                throw new Error('Credential.anc is undefined');
            }
            if (!acdc.ancatc) {
                throw new Error('Credential.ancatc is undefined');
            }
            const [grant, gsigs, gend] = await client.ipex().grant({
                senderName: senderAidAlias,
                acdc: new signify_ts_1.Serder(acdc.sad),
                iss: new signify_ts_1.Serder(acdc.iss),
                anc: new signify_ts_1.Serder(acdc.anc),
                ancAttachment: acdc.ancatc,
                recipient: recipientAidPrefix,
                datetime: this.createTimestamp(),
            });
            const operation = await client.ipex().submitGrant(senderAidAlias, grant, gsigs, gend, [recipientAidPrefix]);
            const completed = await client.operations().wait(operation, { signal: AbortSignal.timeout(this.TIMEOUT_MS) });
            if (completed.error)
                throw new Error(`IPEX grant failed: ${JSON.stringify(completed.error)}`);
            await client.operations().delete(completed.name);
            console_utils_1.ConsoleUtils.succeedSpinner(`Credential granted via IPEX`);
        }
        catch (error) {
            console_utils_1.ConsoleUtils.failSpinner('IPEX grant failed');
            console.error(`\n[ERROR] ${error.message}`);
            console.error(`[DEBUG] Credential object keys:`, acdc ? Object.keys(acdc) : 'undefined');
            throw error;
        }
    }
    static async waitForGrantNotification(client) {
        console_utils_1.ConsoleUtils.startSpinner('Waiting for grant notification');
        for (let attempt = 1; attempt <= this.DEFAULT_RETRIES; attempt++) {
            try {
                const allNotifications = await client.notifications().list();
                const grantNotifications = allNotifications.notes.filter((n) => n.a.r === this.IPEX_GRANT_ROUTE && n.r === false);
                if (grantNotifications.length > 0) {
                    console_utils_1.ConsoleUtils.succeedSpinner('Grant notification received');
                    return grantNotifications[0];
                }
                await (0, console_utils_1.sleep)(this.DELAY_MS);
            }
            catch (error) {
                if (attempt === this.DEFAULT_RETRIES)
                    throw error;
            }
        }
        throw new Error('Grant notification timeout');
    }
    static async admitCredential(client, senderAidAlias, recipientAidPrefix, grantSaid) {
        console_utils_1.ConsoleUtils.startSpinner('Admitting credential via IPEX');
        const [admit, sigs, aend] = await client.ipex().admit({
            senderName: senderAidAlias,
            message: '',
            grantSaid: grantSaid,
            recipient: recipientAidPrefix,
            datetime: this.createTimestamp(),
        });
        const operation = await client.ipex().submitAdmit(senderAidAlias, admit, sigs, aend, [recipientAidPrefix]);
        const completed = await client.operations().wait(operation, { signal: AbortSignal.timeout(this.TIMEOUT_MS) });
        if (completed.error)
            throw new Error(`IPEX admit failed: ${JSON.stringify(completed.error)}`);
        await client.operations().delete(completed.name);
        console_utils_1.ConsoleUtils.succeedSpinner('Credential admitted via IPEX');
    }
    static async markNotificationRead(client, notificationId) {
        await client.notifications().mark(notificationId);
    }
    static createTimestamp() {
        return new Date().toISOString().replace('Z', '000+00:00');
    }
}
exports.KERIAService = KERIAService;
KERIAService.ADMIN_URL = 'http://localhost:3901';
KERIAService.BOOT_URL = 'http://localhost:3903';
KERIAService.TIMEOUT_MS = 120000; // Increased to 120 seconds for chained credentials with edges
KERIAService.DELAY_MS = 5000;
KERIAService.DEFAULT_RETRIES = 5;
KERIAService.ROLE_AGENT = 'agent';
KERIAService.IPEX_GRANT_ROUTE = '/exn/ipex/grant';
KERIAService.DEFAULT_IDENTIFIER_ARGS = {
    toad: 1, // Changed from 3 to 1 - matching single witness availability
    wits: [
        'BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha',
        'BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM',
        'BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX'
    ]
};
//# sourceMappingURL=keria.service.js.map