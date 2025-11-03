import {
    SignifyClient,
    Tier,
    ready,
    CreateIdentiferArgs,
    Salter,
    Serder,
    Saider
} from 'signify-ts';
import { ConsoleUtils, sleep } from '../utils/console.utils';
import { VLEI_RULES } from '../config/vlei-rules.config';

export class KERIAService {
    private static readonly ADMIN_URL = 'http://localhost:3901';
    private static readonly BOOT_URL = 'http://localhost:3903';
    private static readonly TIMEOUT_MS = 120000;  // Increased to 120 seconds for chained credentials with edges
    private static readonly DELAY_MS = 5000;
    private static readonly DEFAULT_RETRIES = 5;
    private static readonly ROLE_AGENT = 'agent';
    private static readonly IPEX_GRANT_ROUTE = '/exn/ipex/grant';

    private static readonly DEFAULT_IDENTIFIER_ARGS: CreateIdentiferArgs = {
        toad: 1,  // Changed from 3 to 1 - matching single witness availability
        wits: [
            'BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha',
            'BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM',
            'BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX'
        ]
    } as any;

    static async initialize(): Promise<void> {
        await ready();
        ConsoleUtils.success('Signify-TS library initialized');
    }

    static async createClient(bran: string): Promise<{ client: SignifyClient; state: any }> {
        const client = new SignifyClient(this.ADMIN_URL, bran, Tier.low, this.BOOT_URL);
        await client.boot();
        await client.connect();
        const state = await client.state();
        return { client, state };
    }

    static async createAID(client: SignifyClient, alias: string, identifierArgs: CreateIdentiferArgs = this.DEFAULT_IDENTIFIER_ARGS): Promise<string> {
        ConsoleUtils.startSpinner(`Creating AID: ${alias}`);
        const inceptionResult = await client.identifiers().create(alias, identifierArgs as any);
        const operation = await inceptionResult.op();
        const completed = await client.operations().wait(operation, { signal: AbortSignal.timeout(this.TIMEOUT_MS) });
        if (completed.error) throw new Error(`AID creation failed: ${JSON.stringify(completed.error)}`);
        const aidPrefix = (completed.response as any)?.i;
        await client.operations().delete(completed.name);
        ConsoleUtils.succeedSpinner(`Created AID: ${alias} (${aidPrefix})`);
        return aidPrefix;
    }

    static async addAgentRole(client: SignifyClient, aidAlias: string): Promise<void> {
        if (!client.agent?.pre) throw new Error('Client agent prefix not available');
        ConsoleUtils.startSpinner(`Adding agent role for ${aidAlias}`);
        const addRoleResult = await client.identifiers().addEndRole(aidAlias, this.ROLE_AGENT, client.agent.pre);
        const operation = await addRoleResult.op();
        const completed = await client.operations().wait(operation, { signal: AbortSignal.timeout(this.TIMEOUT_MS) });
        await client.operations().delete(completed.name);
        ConsoleUtils.succeedSpinner(`Agent role added for ${aidAlias}`);
    }

    static async generateOOBI(client: SignifyClient, aidAlias: string): Promise<string> {
        const oobiResult = await client.oobis().get(aidAlias, this.ROLE_AGENT);
        if (!oobiResult?.oobis?.length) throw new Error('No OOBI URL generated');
        return oobiResult.oobis[0];
    }

    static async resolveOOBI(client: SignifyClient, oobiUrl: string, contactAlias: string): Promise<void> {
        ConsoleUtils.startSpinner(`Resolving OOBI for ${contactAlias}`);
        const operation = await client.oobis().resolve(oobiUrl, contactAlias);
        const completed = await client.operations().wait(operation, { signal: AbortSignal.timeout(this.TIMEOUT_MS) });
        if (completed.error) throw new Error(`OOBI resolution failed: ${JSON.stringify(completed.error)}`);
        await client.operations().delete(completed.name);
        ConsoleUtils.succeedSpinner(`OOBI resolved for ${contactAlias}`);
    }

    static async resolveSchemaOOBI(client: SignifyClient, schemaOobiUrl: string, schemaName: string): Promise<void> {
        ConsoleUtils.startSpinner(`Resolving schema OOBI: ${schemaName}`);
        try {
            const operation = await client.oobis().resolve(schemaOobiUrl, schemaName);
            const completed = await client.operations().wait(operation, { signal: AbortSignal.timeout(this.TIMEOUT_MS) });
            if (completed.error) throw new Error(`Schema OOBI resolution failed: ${JSON.stringify(completed.error)}`);
            await client.operations().delete(completed.name);
            ConsoleUtils.succeedSpinner(`Schema OOBI resolved: ${schemaName}`);
        } catch (error: any) {
            ConsoleUtils.failSpinner(`Schema OOBI resolution failed: ${schemaName}`);
            console.error(`\nError details:`);
            console.error(`  URL: ${schemaOobiUrl}`);
            console.error(`  Schema: ${schemaName}`);
            console.error(`  Error: ${error.message}`);
            if (error.cause) console.error(`  Cause: ${error.cause}`);
            throw error;
        }
    }

    static async createRegistry(client: SignifyClient, aidAlias: string, registryName: string): Promise<string> {
        ConsoleUtils.startSpinner(`Creating registry: ${registryName}`);
        const createResult = await client.registries().create({ name: aidAlias, registryName });
        const operation = await createResult.op();
        const completed = await client.operations().wait(operation, { signal: AbortSignal.timeout(this.TIMEOUT_MS) });
        if (completed.error) throw new Error(`Registry creation failed: ${JSON.stringify(completed.error)}`);
        const registrySaid = (completed.response as any)?.anchor?.i;
        await client.operations().delete(completed.name);
        ConsoleUtils.succeedSpinner(`Registry created: ${registrySaid}`);
        return registrySaid;
    }

    static async issueCredential(client: SignifyClient, issuerAidAlias: string, registryIdentifier: string, schemaSaid: string, holderAidPrefix: string, credentialAttributes: any, edges?: any, rules?: any): Promise<{ said: string; credential: any }> {
        ConsoleUtils.startSpinner(`Issuing credential from ${issuerAidAlias}`);
        
        try {
            console.log(`\n[DEBUG] Starting credential issuance:`);
            console.log(`  Issuer: ${issuerAidAlias}`);
            console.log(`  Registry: ${registryIdentifier}`);
            console.log(`  Schema: ${schemaSaid}`);
            console.log(`  Holder: ${holderAidPrefix}`);
            
            // Build credential payload
            const credentialPayload: any = {
                ri: registryIdentifier,
                s: schemaSaid,
                u: new Salter({}).qb64,
                a: { i: holderAidPrefix, ...credentialAttributes }
            };
            
            // Add edges if provided
            if (edges) {
                console.log(`[DEBUG] SAIDifying edges...`);
                const saidifiedEdges = Saider.saidify({ d: '', ...edges })[1];
                credentialPayload.e = saidifiedEdges;
                console.log(`[DEBUG] Edges SAIDified: ${saidifiedEdges.d}`);
            }
            
            // Add rules
            console.log(`[DEBUG] SAIDifying rules...`);
            const rulesToUse = rules || VLEI_RULES.STANDARD_RULES;
            const saidifiedRules = Saider.saidify({ d: '', ...rulesToUse })[1];
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
            } catch (error: any) {
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
            const credentialSaid = (completed.response as any)?.ced?.d || completed.metadata?.ced?.d;
            
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
                        await sleep(retryDelay);
                    } else {
                        await sleep(1000); // Initial wait
                    }
                    
                    credential = await client.credentials().get(credentialSaid);
                    console.log(`[DEBUG] Credential retrieved from client store${attempt > 0 ? ` on retry ${attempt}` : ''}`);
                    break; // Success!
                    
                } catch (error: any) {
                    if (attempt === maxRetries - 1) {
                        // Last attempt failed
                        throw new Error(
                            `Credential not available after ${maxRetries} attempts. ` +
                            `Witnesses may be down or slow. Error: ${error.message}`
                        );
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
            ConsoleUtils.succeedSpinner(`Credential issued: ${credentialSaid}`);
            return { said: credentialSaid, credential };
            
        } catch (error: any) {
            ConsoleUtils.failSpinner(`Credential issuance failed`);
            console.error(`\n[ERROR] ${error.message}`);
            throw error;
        }
    }

    static async grantCredential(client: SignifyClient, senderAidAlias: string, recipientAidPrefix: string, acdc: any): Promise<void> {
        ConsoleUtils.startSpinner(`Granting credential via IPEX`);
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
                acdc: new Serder(acdc.sad),
                iss: new Serder(acdc.iss),
                anc: new Serder(acdc.anc),
                ancAttachment: acdc.ancatc,
                recipient: recipientAidPrefix,
                datetime: this.createTimestamp(),
            });
            const operation = await client.ipex().submitGrant(senderAidAlias, grant, gsigs, gend, [recipientAidPrefix]);
            const completed = await client.operations().wait(operation, { signal: AbortSignal.timeout(this.TIMEOUT_MS) });
            if (completed.error) throw new Error(`IPEX grant failed: ${JSON.stringify(completed.error)}`);
            await client.operations().delete(completed.name);
            ConsoleUtils.succeedSpinner(`Credential granted via IPEX`);
        } catch (error: any) {
            ConsoleUtils.failSpinner('IPEX grant failed');
            console.error(`\n[ERROR] ${error.message}`);
            console.error(`[DEBUG] Credential object keys:`, acdc ? Object.keys(acdc) : 'undefined');
            throw error;
        }
    }

    static async waitForGrantNotification(client: SignifyClient): Promise<any> {
        ConsoleUtils.startSpinner('Waiting for grant notification');
        for (let attempt = 1; attempt <= this.DEFAULT_RETRIES; attempt++) {
            try {
                const allNotifications = await client.notifications().list();
                const grantNotifications = allNotifications.notes.filter((n: any) => n.a.r === this.IPEX_GRANT_ROUTE && n.r === false);
                if (grantNotifications.length > 0) {
                    ConsoleUtils.succeedSpinner('Grant notification received');
                    return grantNotifications[0];
                }
                await sleep(this.DELAY_MS);
            } catch (error) {
                if (attempt === this.DEFAULT_RETRIES) throw error;
            }
        }
        throw new Error('Grant notification timeout');
    }

    static async admitCredential(client: SignifyClient, senderAidAlias: string, recipientAidPrefix: string, grantSaid: string): Promise<void> {
        ConsoleUtils.startSpinner('Admitting credential via IPEX');
        const [admit, sigs, aend] = await client.ipex().admit({
            senderName: senderAidAlias,
            message: '',
            grantSaid: grantSaid,
            recipient: recipientAidPrefix,
            datetime: this.createTimestamp(),
        });
        const operation = await client.ipex().submitAdmit(senderAidAlias, admit, sigs, aend, [recipientAidPrefix]);
        const completed = await client.operations().wait(operation, { signal: AbortSignal.timeout(this.TIMEOUT_MS) });
        if (completed.error) throw new Error(`IPEX admit failed: ${JSON.stringify(completed.error)}`);
        await client.operations().delete(completed.name);
        ConsoleUtils.succeedSpinner('Credential admitted via IPEX');
    }

    static async markNotificationRead(client: SignifyClient, notificationId: string): Promise<void> {
        await client.notifications().mark(notificationId);
    }

    private static createTimestamp(): string {
        return new Date().toISOString().replace('Z', '000+00:00');
    }
}
