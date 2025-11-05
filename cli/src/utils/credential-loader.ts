import * as fs from 'fs/promises';
import * as path from 'path';

export interface IdentityData {
    alias: string;
    type: string;
    prefix: string;
    oobi?: string;
}

export interface CredentialData {
    type: string;
    issuer: string;
    issuee: string;
    said: string;
    status: string;
    schema: string;
    registry: string;
    attributes?: any;
    edges?: {
        [key: string]: {
            n: string;
            s: string;
        };
    };
    lei?: string;
    issuedAt?: string;
    credential?: any; // For compatibility
}

export class CredentialDataLoader {
    private dataDir: string;
    
    constructor(dataDir: string = './data') {
        this.dataDir = dataDir;
    }
    
    async loadIdentities(): Promise<Map<string, IdentityData>> {
        const filePath = path.join(this.dataDir, 'identities.json');
        const data = await fs.readFile(filePath, 'utf-8');
        const identities: IdentityData[] = JSON.parse(data);
        
        const map = new Map<string, IdentityData>();
        identities.forEach(identity => {
            map.set(identity.alias, identity);
            map.set(identity.prefix, identity);
        });
        
        return map;
    }
    
    async loadCredentials(): Promise<Map<string, CredentialData>> {
        const filePath = path.join(this.dataDir, 'credentials.json');
        const data = await fs.readFile(filePath, 'utf-8');
        const credentials: CredentialData[] = JSON.parse(data);
        
        const map = new Map<string, CredentialData>();
        credentials.forEach(cred => {
            map.set(cred.said, cred);
        });
        
        return map;
    }
    
    async getCredentialChain(agentAlias: string): Promise<CredentialData[]> {
        const credentials = await this.loadCredentials();
        const identities = await this.loadIdentities();
        
        const agent = identities.get(agentAlias);
        if (!agent) {
            throw new Error(`Agent ${agentAlias} not found`);
        }
        
        const chain: CredentialData[] = [];
        
        // Find ECR credential issued to agent
        const ecrCred = Array.from(credentials.values()).find(
            c => c.type.includes('Engagement Context Role') && c.issuee === agent.prefix
        );
        
        if (!ecrCred) {
            throw new Error(`No ECR credential found for ${agentAlias}`);
        }
        
        chain.push(ecrCred);
        
        // Walk up the chain using edges
        let currentCred: any = ecrCred;
        while (currentCred.edges) {
            const edges = currentCred.edges;
            let nextSAID: string | null = null;
            
            // ECR has edge to LE (not person/OOR)
            // So ECR -> LE -> QVI
            // We need to find the person's OOR separately
            if (edges.le) {
                nextSAID = edges.le.n;
            }
            // Check for OOR edge (would be from person's ECR if it existed)
            else if (edges.oor) {
                nextSAID = edges.oor.n;
            }
            // Check for auth edge (OOR -> OOR_AUTH)
            else if (edges.auth) {
                nextSAID = edges.auth.n;
            }
            // Check for qvi edge (LE -> QVI)
            else if (edges.qvi) {
                nextSAID = edges.qvi.n;
            }
            
            if (!nextSAID) break;
            
            const nextCred = credentials.get(nextSAID);
            if (!nextCred) break;
            
            chain.push(nextCred);
            currentCred = nextCred;
        }
        
        // Now find the person's OOR and OOR_AUTH credentials
        // ECR attributes contain personLegalName which links to person
        const personName = ecrCred.attributes?.personLegalName;
        if (personName) {
            // Find OOR for this person
            const oorCred = Array.from(credentials.values()).find(
                c => c.type.includes('Official Organizational Role') && 
                     c.attributes?.personLegalName === personName &&
                     c.attributes?.LEI === ecrCred.attributes?.LEI
            );
            
            if (oorCred && !chain.find(c => c.said === oorCred.said)) {
                // Insert OOR after ECR (position 1)
                chain.splice(1, 0, oorCred);
                
                // Find OOR_AUTH (OOR has auth edge)
                if (oorCred.edges?.auth) {
                    const authCred = credentials.get(oorCred.edges.auth.n);
                    if (authCred && !chain.find(c => c.said === authCred.said)) {
                        // Insert OOR_AUTH after OOR (position 2)
                        chain.splice(2, 0, authCred);
                    }
                }
            }
        }
        
        return chain;
    }
    
    async getAllAgents(): Promise<IdentityData[]> {
        const identities = await this.loadIdentities();
        return Array.from(identities.values()).filter(id => id.type === 'agent');
    }
}
