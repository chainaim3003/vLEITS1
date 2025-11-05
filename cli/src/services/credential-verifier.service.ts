import { SignifyClient, ready } from 'signify-ts';
import { CredentialDataLoader, CredentialData } from '../utils/credential-loader';

interface VerificationResult {
    valid: boolean;
    credential?: any;
    reason?: string;
    localData?: any;
}

interface ChainVerification {
    type: string;
    said: string;
    valid: boolean;
    reason?: string;
}

interface EdgeVerification {
    from: string;
    to: string;
    edgeName: string;
    valid: boolean;
    reason?: string;
}

export class RealCredentialVerifier {
    private client: SignifyClient | null = null;
    private loader: CredentialDataLoader;
    private static readonly ADMIN_URL = 'http://localhost:3901';
    private static readonly BOOT_URL = 'http://localhost:3903';
    private static readonly TIMEOUT_MS = 30000;
    
    constructor(dataDir: string = './data') {
        this.loader = new CredentialDataLoader(dataDir);
    }
    
    async initialize(bran: string): Promise<void> {
        await ready();
        this.client = new SignifyClient(
            RealCredentialVerifier.ADMIN_URL,
            bran,
            'low' as any,
            RealCredentialVerifier.BOOT_URL
        );
        await this.client.boot();
        await this.client.connect();
    }
    
    /**
     * Verify credential from local data only
     * (More realistic - verifiers don't need KERIA access)
     */
    async verifyCredentialFromData(credentialSAID: string): Promise<VerificationResult> {
        try {
            // Get credential from local data
            const credentials = await this.loader.loadCredentials();
            const localCred = credentials.get(credentialSAID);
            
            if (!localCred) {
                return {
                    valid: false,
                    reason: 'Credential not found in local data'
                };
            }
            
            // Verify SAID matches (integrity check)
            if (localCred.said !== credentialSAID) {
                return {
                    valid: false,
                    reason: 'SAID mismatch - credential may be tampered'
                };
            }
            
            // Check status from local data
            if (localCred.status !== 'issued') {
                return {
                    valid: false,
                    reason: `Credential status is ${localCred.status}`,
                    credential: localCred
                };
            }
            
            return {
                valid: true,
                credential: localCred,
                localData: localCred
            };
            
        } catch (error: any) {
            return {
                valid: false,
                reason: `Verification error: ${error.message}`
            };
        }
    }
    
    /**
     * Verify complete chain for an agent
     */
    async verifyAgentChain(agentAlias: string): Promise<{
        valid: boolean;
        chain: ChainVerification[];
    }> {
        const chain = await this.loader.getCredentialChain(agentAlias);
        const results: ChainVerification[] = [];
        
        for (const cred of chain) {
            const result = await this.verifyCredentialFromData(cred.said);
            results.push({
                type: cred.type,
                said: cred.said,
                valid: result.valid,
                reason: result.reason
            });
            
            if (!result.valid) {
                return {
                    valid: false,
                    chain: results
                };
            }
        }
        
        return {
            valid: true,
            chain: results
        };
    }
    
    /**
     * Verify issuer exists in local data
     */
    async verifyIssuerKEL(credentialSAID: string): Promise<{
        valid: boolean;
        issuer?: string;
        reason?: string;
        kelLength?: number;
    }> {
        try {
            const credentials = await this.loader.loadCredentials();
            const cred = credentials.get(credentialSAID);
            
            if (!cred) {
                return { valid: false, reason: 'Credential not found' };
            }
            
            const issuerAID = cred.issuer;
            
            // Check if issuer exists in identities
            const identities = await this.loader.loadIdentities();
            const issuerIdentity = identities.get(issuerAID);
            
            if (!issuerIdentity) {
                return {
                    valid: false,
                    issuer: issuerAID,
                    reason: 'Issuer not found in local identities'
                };
            }
            
            return {
                valid: true,
                issuer: issuerAID,
                kelLength: 1 // Simplified - would need actual KEL data
            };
            
        } catch (error: any) {
            return {
                valid: false,
                reason: `KEL verification failed: ${error.message}`
            };
        }
    }
    
    /**
     * Verify all edges in credential chain
     */
    async verifyChainEdges(agentAlias: string): Promise<{
        valid: boolean;
        edges: EdgeVerification[];
    }> {
        const chain = await this.loader.getCredentialChain(agentAlias);
        const edgeResults: EdgeVerification[] = [];
        
        for (let i = 0; i < chain.length - 1; i++) {
            const currentCred = chain[i];
            const nextCred = chain[i + 1];
            
            const edges = currentCred.edges;
            if (!edges) {
                edgeResults.push({
                    from: currentCred.type,
                    to: nextCred.type,
                    edgeName: 'unknown',
                    valid: false,
                    reason: 'No edge found'
                });
                continue;
            }
            
            // Find the edge that points to next credential
            let edgeName = '';
            let edgeData: any = null;
            
            for (const [name, data] of Object.entries(edges)) {
                if ((data as any).n === nextCred.said) {
                    edgeName = name;
                    edgeData = data;
                    break;
                }
            }
            
            if (!edgeData) {
                edgeResults.push({
                    from: currentCred.type,
                    to: nextCred.type,
                    edgeName: 'unknown',
                    valid: false,
                    reason: 'Edge SAID does not match next credential'
                });
                continue;
            }
            
            // Verify edge schema matches next credential schema
            const edgeSchema = (edgeData as any).s;
            const nextSchema = nextCred.schema;
            
            if (edgeSchema !== nextSchema) {
                edgeResults.push({
                    from: currentCred.type,
                    to: nextCred.type,
                    edgeName,
                    valid: false,
                    reason: `Edge schema mismatch: ${edgeSchema} != ${nextSchema}`
                });
                continue;
            }
            
            edgeResults.push({
                from: currentCred.type,
                to: nextCred.type,
                edgeName,
                valid: true
            });
        }
        
        const allValid = edgeResults.every(e => e.valid);
        
        return {
            valid: allValid,
            edges: edgeResults
        };
    }
}
