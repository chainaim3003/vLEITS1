import { Request, Response } from 'express';
import { RealCredentialVerifier } from '../../services/credential-verifier.service';
import { CredentialDataLoader } from '../../utils/credential-loader';

export class VerifyController {
    /**
     * POST /api/v1/verify/credential
     * Verify a single credential by SAID
     */
    static async verifyCredential(req: Request, res: Response) {
        try {
            const { credentialSAID } = req.body;

            if (!credentialSAID) {
                return res.status(400).json({
                    success: false,
                    error: 'credentialSAID is required'
                });
            }

            const verifier: RealCredentialVerifier = req.app.locals.verifier;
            const result = await verifier.verifyCredentialFromData(credentialSAID);

            res.json({
                success: true,
                valid: result.valid,
                credential: result.credential,
                reason: result.reason,
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * POST /api/v1/verify/agent/chain
     * Verify complete credential chain for an agent
     */
    static async verifyAgentChain(req: Request, res: Response) {
        try {
            const { agentAlias } = req.body;

            if (!agentAlias) {
                return res.status(400).json({
                    success: false,
                    error: 'agentAlias is required'
                });
            }

            const verifier: RealCredentialVerifier = req.app.locals.verifier;
            const result = await verifier.verifyAgentChain(agentAlias);

            res.json({
                success: true,
                valid: result.valid,
                agentAlias,
                chain: result.chain,
                summary: {
                    totalCredentials: result.chain.length,
                    validCredentials: result.chain.filter(c => c.valid).length,
                    invalidCredentials: result.chain.filter(c => !c.valid).length
                },
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * POST /api/v1/verify/agent/edges
     * Verify credential chain edges
     */
    static async verifyChainEdges(req: Request, res: Response) {
        try {
            const { agentAlias } = req.body;

            if (!agentAlias) {
                return res.status(400).json({
                    success: false,
                    error: 'agentAlias is required'
                });
            }

            const verifier: RealCredentialVerifier = req.app.locals.verifier;
            const result = await verifier.verifyChainEdges(agentAlias);

            res.json({
                success: true,
                valid: result.valid,
                agentAlias,
                edges: result.edges,
                summary: {
                    totalEdges: result.edges.length,
                    validEdges: result.edges.filter(e => e.valid).length,
                    invalidEdges: result.edges.filter(e => !e.valid).length
                },
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * POST /api/v1/verify/trading-partner
     * Comprehensive buyer-seller verification
     */
    static async verifyTradingPartner(req: Request, res: Response) {
        try {
            const { seller, buyer, transaction } = req.body;

            if (!seller?.identifier) {
                return res.status(400).json({
                    success: false,
                    error: 'seller.identifier is required'
                });
            }

            const verifier: RealCredentialVerifier = req.app.locals.verifier;
            const loader: CredentialDataLoader = req.app.locals.loader;

            // Verify seller's complete chain
            const sellerChain = await verifier.verifyAgentChain(seller.identifier);
            const sellerEdges = await verifier.verifyChainEdges(seller.identifier);
            
            // Get seller details
            const sellerCredChain = await loader.getCredentialChain(seller.identifier);
            const sellerAgent = (await loader.loadIdentities()).get(
                sellerCredChain[0]?.issuee || ''
            );
            
            // Calculate trust score
            let trustScore = 0;
            if (sellerChain.valid) trustScore += 30;
            if (sellerEdges.valid) trustScore += 25;
            if (sellerChain.chain.length === 5) trustScore += 20;
            if (sellerChain.chain.every(c => c.valid)) trustScore += 15;
            trustScore += 10; // Base score

            const approved = trustScore >= 75;
            const confidence = trustScore >= 90 ? 'HIGH' : trustScore >= 75 ? 'MEDIUM' : 'LOW';
            const riskLevel = trustScore >= 90 ? 'LOW' : trustScore >= 75 ? 'MEDIUM' : 'HIGH';
            
            let recommendation = 'REJECTED';
            if (trustScore >= 90) recommendation = 'APPROVED';
            else if (trustScore >= 75) recommendation = 'APPROVED_WITH_CONDITIONS';
            else if (trustScore >= 60) recommendation = 'REVIEW_REQUIRED';

            // Build reasoning
            const reasoning: string[] = [];
            if (sellerChain.valid) {
                reasoning.push('Seller has valid credential chain');
            }
            if (sellerEdges.valid) {
                reasoning.push('All credential edges are valid');
            }
            if (sellerChain.chain.length === 5) {
                reasoning.push('Complete 5-credential chain present');
            }
            if (!sellerChain.valid || !sellerEdges.valid) {
                reasoning.push('WARNING: Issues detected in credential chain');
            }

            // Get warnings and red flags
            const warnings: string[] = [];
            const redFlags: string[] = [];

            if (!sellerEdges.valid) {
                warnings.push('Some credential edges are invalid');
            }

            const revokedCreds = sellerChain.chain.filter(c => 
                c.reason?.toLowerCase().includes('revoked')
            );
            if (revokedCreds.length > 0) {
                redFlags.push('CRITICAL: One or more credentials revoked');
            }

            // Build seller info
            const ecr = sellerCredChain[0];
            const oor = sellerCredChain[1];
            const le = sellerCredChain[3];

            const response = {
                success: true,
                timestamp: new Date().toISOString(),
                verificationId: `VER-${Date.now()}`,
                decision: {
                    approved,
                    confidence,
                    trustScore,
                    riskLevel,
                    recommendation,
                    reasoning
                },
                seller: {
                    agent: {
                        alias: seller.identifier,
                        aid: sellerAgent?.aid || ecr?.issuee || '',
                        name: ecr?.attributes?.personLegalName || 'Unknown',
                        role: ecr?.type || 'Seller Agent'
                    },
                    company: {
                        name: le?.attributes?.LEI || 'Unknown Company',
                        lei: le?.attributes?.LEI || '',
                        legalEntityAID: le?.issuee || ''
                    },
                    credentials: {
                        ecr: {
                            type: ecr?.type || '',
                            said: ecr?.said || '',
                            status: ecr?.status || '',
                            valid: sellerChain.chain[0]?.valid || false
                        },
                        oor: {
                            type: oor?.type || '',
                            said: oor?.said || '',
                            status: oor?.status || '',
                            valid: sellerChain.chain[1]?.valid || false
                        },
                        le: {
                            type: le?.type || '',
                            said: le?.said || '',
                            status: le?.status || '',
                            valid: sellerChain.chain[3]?.valid || false
                        }
                    },
                    chainVerification: {
                        complete: sellerChain.valid,
                        valid: sellerChain.valid && sellerEdges.valid,
                        credentialCount: sellerChain.chain.length,
                        allCredentialsValid: sellerChain.chain.every(c => c.valid),
                        allEdgesValid: sellerEdges.valid,
                        chainIntegrity: sellerChain.valid ? 'INTACT' : 'BROKEN'
                    }
                },
                warnings,
                redFlags
            };

            res.json(response);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}
