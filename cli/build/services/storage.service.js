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
exports.StorageService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
class StorageService {
    static ensureDataDir() {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
    }
    static readJSON(filename) {
        this.ensureDataDir();
        const filepath = path.join(DATA_DIR, filename);
        if (!fs.existsSync(filepath)) {
            return [];
        }
        const data = fs.readFileSync(filepath, 'utf-8');
        return JSON.parse(data);
    }
    static writeJSON(filename, data) {
        this.ensureDataDir();
        const filepath = path.join(DATA_DIR, filename);
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    }
    // Identity management
    static saveIdentity(identity) {
        const identities = this.readJSON('identities.json');
        const index = identities.findIndex(i => i.alias === identity.alias);
        if (index >= 0) {
            identities[index] = identity;
        }
        else {
            identities.push(identity);
        }
        this.writeJSON('identities.json', identities);
    }
    static getIdentities() {
        return this.readJSON('identities.json');
    }
    static getIdentity(alias) {
        const identities = this.getIdentities();
        return identities.find(i => i.alias === alias) || null;
    }
    // Credential management
    static saveCredential(credential) {
        const credentials = this.readJSON('credentials.json');
        const index = credentials.findIndex(c => c.said === credential.said);
        if (index >= 0) {
            credentials[index] = credential;
        }
        else {
            credentials.push(credential);
        }
        this.writeJSON('credentials.json', credentials);
    }
    static getCredentials() {
        return this.readJSON('credentials.json');
    }
    static getCredential(said) {
        const credentials = this.getCredentials();
        return credentials.find(c => c.said === said) || null;
    }
    // Registry management
    static saveRegistry(registry) {
        const registries = this.readJSON('registries.json');
        const index = registries.findIndex(r => r.identifier === registry.identifier);
        if (index >= 0) {
            registries[index] = registry;
        }
        else {
            registries.push(registry);
        }
        this.writeJSON('registries.json', registries);
    }
    static getRegistries() {
        return this.readJSON('registries.json');
    }
    static getRegistry(identifier) {
        const registries = this.getRegistries();
        return registries.find(r => r.identifier === identifier) || null;
    }
    // Connection management
    static saveConnection(connection) {
        const connections = this.readJSON('connections.json');
        const index = connections.findIndex(c => c.alias === connection.alias);
        if (index >= 0) {
            connections[index] = connection;
        }
        else {
            connections.push(connection);
        }
        this.writeJSON('connections.json', connections);
    }
    static getConnections() {
        return this.readJSON('connections.json');
    }
    // Clear all data
    static clearAll() {
        const files = ['identities.json', 'credentials.json', 'registries.json', 'connections.json'];
        files.forEach(file => {
            const filepath = path.join(DATA_DIR, file);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        });
    }
}
exports.StorageService = StorageService;
//# sourceMappingURL=storage.service.js.map