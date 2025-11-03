import { SignifyClient, CreateIdentiferArgs } from 'signify-ts';
export declare class KERIAService {
    private static readonly ADMIN_URL;
    private static readonly BOOT_URL;
    private static readonly TIMEOUT_MS;
    private static readonly DELAY_MS;
    private static readonly DEFAULT_RETRIES;
    private static readonly ROLE_AGENT;
    private static readonly IPEX_GRANT_ROUTE;
    private static readonly DEFAULT_IDENTIFIER_ARGS;
    static initialize(): Promise<void>;
    static createClient(bran: string): Promise<{
        client: SignifyClient;
        state: any;
    }>;
    static createAID(client: SignifyClient, alias: string, identifierArgs?: CreateIdentiferArgs): Promise<string>;
    static addAgentRole(client: SignifyClient, aidAlias: string): Promise<void>;
    static generateOOBI(client: SignifyClient, aidAlias: string): Promise<string>;
    static resolveOOBI(client: SignifyClient, oobiUrl: string, contactAlias: string): Promise<void>;
    static resolveSchemaOOBI(client: SignifyClient, schemaOobiUrl: string, schemaName: string): Promise<void>;
    static createRegistry(client: SignifyClient, aidAlias: string, registryName: string): Promise<string>;
    static issueCredential(client: SignifyClient, issuerAidAlias: string, registryIdentifier: string, schemaSaid: string, holderAidPrefix: string, credentialAttributes: any, edges?: any, rules?: any): Promise<{
        said: string;
        credential: any;
    }>;
    static grantCredential(client: SignifyClient, senderAidAlias: string, recipientAidPrefix: string, acdc: any): Promise<void>;
    static waitForGrantNotification(client: SignifyClient): Promise<any>;
    static admitCredential(client: SignifyClient, senderAidAlias: string, recipientAidPrefix: string, grantSaid: string): Promise<void>;
    static markNotificationRead(client: SignifyClient, notificationId: string): Promise<void>;
    private static createTimestamp;
}
//# sourceMappingURL=keria.service.d.ts.map