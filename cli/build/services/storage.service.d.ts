import { VLEIIdentity, VLEICredential, CredentialRegistry, OOBIConnection } from '../types/vlei.types';
export declare class StorageService {
    private static ensureDataDir;
    private static readJSON;
    private static writeJSON;
    static saveIdentity(identity: VLEIIdentity): void;
    static getIdentities(): VLEIIdentity[];
    static getIdentity(alias: string): VLEIIdentity | null;
    static saveCredential(credential: VLEICredential): void;
    static getCredentials(): VLEICredential[];
    static getCredential(said: string): VLEICredential | null;
    static saveRegistry(registry: CredentialRegistry): void;
    static getRegistries(): CredentialRegistry[];
    static getRegistry(identifier: string): CredentialRegistry | null;
    static saveConnection(connection: OOBIConnection): void;
    static getConnections(): OOBIConnection[];
    static clearAll(): void;
}
//# sourceMappingURL=storage.service.d.ts.map