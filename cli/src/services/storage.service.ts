import * as fs from 'fs';
import * as path from 'path';
import { 
    VLEIIdentity, 
    VLEICredential, 
    CredentialRegistry, 
    OOBIConnection 
} from '../types/vlei.types';

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

export class StorageService {
    private static ensureDataDir(): void {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
    }

    private static readJSON<T>(filename: string): T[] {
        this.ensureDataDir();
        const filepath = path.join(DATA_DIR, filename);
        if (!fs.existsSync(filepath)) {
            return [];
        }
        const data = fs.readFileSync(filepath, 'utf-8');
        return JSON.parse(data);
    }

    private static writeJSON<T>(filename: string, data: T[]): void {
        this.ensureDataDir();
        const filepath = path.join(DATA_DIR, filename);
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    }

    // Identity management
    static saveIdentity(identity: VLEIIdentity): void {
        const identities = this.readJSON<VLEIIdentity>('identities.json');
        const index = identities.findIndex(i => i.alias === identity.alias);
        if (index >= 0) {
            identities[index] = identity;
        } else {
            identities.push(identity);
        }
        this.writeJSON('identities.json', identities);
    }

    static getIdentities(): VLEIIdentity[] {
        return this.readJSON<VLEIIdentity>('identities.json');
    }

    static getIdentity(alias: string): VLEIIdentity | null {
        const identities = this.getIdentities();
        return identities.find(i => i.alias === alias) || null;
    }

    // Credential management
    static saveCredential(credential: VLEICredential): void {
        const credentials = this.readJSON<VLEICredential>('credentials.json');
        const index = credentials.findIndex(c => c.said === credential.said);
        if (index >= 0) {
            credentials[index] = credential;
        } else {
            credentials.push(credential);
        }
        this.writeJSON('credentials.json', credentials);
    }

    static getCredentials(): VLEICredential[] {
        return this.readJSON<VLEICredential>('credentials.json');
    }

    static getCredential(said: string): VLEICredential | null {
        const credentials = this.getCredentials();
        return credentials.find(c => c.said === said) || null;
    }

    // Registry management
    static saveRegistry(registry: CredentialRegistry): void {
        const registries = this.readJSON<CredentialRegistry>('registries.json');
        const index = registries.findIndex(r => r.identifier === registry.identifier);
        if (index >= 0) {
            registries[index] = registry;
        } else {
            registries.push(registry);
        }
        this.writeJSON('registries.json', registries);
    }

    static getRegistries(): CredentialRegistry[] {
        return this.readJSON<CredentialRegistry>('registries.json');
    }

    static getRegistry(identifier: string): CredentialRegistry | null {
        const registries = this.getRegistries();
        return registries.find(r => r.identifier === identifier) || null;
    }

    // Connection management
    static saveConnection(connection: OOBIConnection): void {
        const connections = this.readJSON<OOBIConnection>('connections.json');
        const index = connections.findIndex(c => c.alias === connection.alias);
        if (index >= 0) {
            connections[index] = connection;
        } else {
            connections.push(connection);
        }
        this.writeJSON('connections.json', connections);
    }

    static getConnections(): OOBIConnection[] {
        return this.readJSON<OOBIConnection>('connections.json');
    }

    // Clear all data
    static clearAll(): void {
        const files = ['identities.json', 'credentials.json', 'registries.json', 'connections.json'];
        files.forEach(file => {
            const filepath = path.join(DATA_DIR, file);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        });
    }
}
