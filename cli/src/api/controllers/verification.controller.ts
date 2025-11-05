import { Request, Response } from 'express';
import { RealCredentialVerifier } from '../../services/credential-verifier.service';
import { CredentialDataLoader } from '../../utils/credential-loader';
import type { 
  TradingPartnerVerificationRequest,
  Decision,
  Recommendation,
  Confidence,
  RiskLevel
} from '../types/api.types';

export class VerificationController {
  private verifier: RealCredentialVerifier;
  private loader: CredentialDataLoader;

  constructor(dataDir: string = './data') {
    console.log(`📁 Initializing VerificationController with dataDir: ${dataDir}`);
    this.verifier = new RealCredentialVerifier(dataDir);
    this.loader = new CredentialDataLoader(dataDir);
  }

  /**
   * Verify trading partner (comprehensive verification)
   * POST /api/v1/verify/trading-partner
   */
  async verifyTradingPartner(req: Request, res: Response): Promise<void> {
    try {
      const request: TradingPartnerVerificationRequest = req.body;

      // Validate request
      if (!request.seller?.identifier) {
        res.status(400).json({
          success: false,
          error: 'seller.identifier is required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const sellerAlias = request.seller.identifier;

      // 1. Verify seller's complete chain
      const chainResult = await this.verifier.verifyAgentChain(sellerAlias);

      // 2. Verify seller's edges
      const edgesResult = await this.verifier.verifyChainEdges(sellerAlias);

      // 3. Get seller's credential details
      const chain = await this.loader.getCredentialChain(sellerAlias);
      const identities = await this.loader.loadIdentities();
      const credentials = await this.loader.loadCredentials();

      // Find seller agent identity
      const sellerAgent = Array.from(identities.values()).find(
        (id) => id.alias === sellerAlias && id.type === 'agent'
      );

      if (!sellerAgent) {
        res.status(404).json({
          success: false,
          error: `Agent not found: ${sellerAlias}`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Get credentials from chain
      const ecrCred = chain.length > 0 ? chain[0] : null;
      const oorCred = chain.length > 1 ? chain[1] : null;
      const oorAuthCred = chain.length > 2 ? chain[2] : null;
      const leCred = chain.length > 3 ? chain[3] : null;
      const qviCred = chain.length > 4 ? chain[4] : null;

      // Find Legal Entity
      const leIdentity = leCred ? Array.from(identities.values()).find(
        (id) => id.aid === leCred.issuer || id.aid === leCred.issuee
      ) : null;

      // Calculate trust score
      const trustScore = this.calculateTrustScore({
        chainValid: chainResult.valid,
        edgesValid: edgesResult.valid,
        credentialCount: chain.length,
        allValid: chainResult.chain.every((c) => c.valid),
      });

      // Make decision
      const decision: Decision = {
        approved: trustScore >= 75 && chainResult.valid,
        confidence: this.getConfidence(trustScore),
        trustScore,
        riskLevel: this.getRiskLevel(trustScore, edgesResult.valid),
        recommendation: this.makeRecommendation(trustScore, chainResult.valid),
        reasoning: this.getReasoning(chainResult, edgesResult, trustScore),
      };

      // Get warnings and red flags
      const warnings = this.getWarnings(chainResult, edgesResult);
      const redFlags = this.getRedFlags(chainResult, edgesResult);

      // Build response
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        verificationId: `VER-${Date.now()}-${sellerAlias.substring(0, 8)}`,
        decision,
        seller: {
          agent: {
            alias: sellerAgent.alias,
            prefix: sellerAgent.prefix,
            name: ecrCred?.attributes?.personLegalName || 'Unknown',
            role: sellerAgent.role || 'Seller Agent',
          },
          company: {
            name: leIdentity?.alias || 'Unknown Company',
            lei: leCred?.attributes?.LEI || leCred?.lei || 'Unknown',
          },
          credentials: {
            ecr: ecrCred
              ? {
                  type: ecrCred.type,
                  said: ecrCred.said,
                  status: ecrCred.status,
                  valid: chainResult.chain[0]?.valid || false,
                }
              : undefined,
            oor: oorCred
              ? {
                  type: oorCred.type,
                  said: oorCred.said,
                  status: oorCred.status,
                  valid: chainResult.chain[1]?.valid || false,
                }
              : undefined,
            oorAuth: oorAuthCred
              ? {
                  type: oorAuthCred.type,
                  said: oorAuthCred.said,
                  status: oorAuthCred.status,
                  valid: chainResult.chain[2]?.valid || false,
                }
              : undefined,
            le: leCred
              ? {
                  type: leCred.type,
                  said: leCred.said,
                  status: leCred.status,
                  valid: chainResult.chain[3]?.valid || false,
                }
              : undefined,
            qvi: qviCred
              ? {
                  type: qviCred.type,
                  said: qviCred.said,
                  status: qviCred.status,
                  valid: chainResult.chain[4]?.valid || false,
                }
              : undefined,
          },
          chainVerification: {
            complete: chain.length === 5,
            valid: chainResult.valid && edgesResult.valid,
            credentialCount: chain.length,
            allCredentialsValid: chainResult.chain.every((c) => c.valid),
          },
        },
        warnings,
        redFlags,
      };

      res.json(response);
    } catch (error: any) {
      console.error('Verification error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Verification failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get list of available agents
   * GET /api/v1/agents
   */
  async getAgents(req: Request, res: Response): Promise<void> {
    try {
      const agents = await this.loader.getAllAgents();

      res.json({
        success: true,
        count: agents.length,
        agents: agents.map((agent) => ({
          alias: agent.alias,
          prefix: agent.prefix,
          role: agent.role,
        })),
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Health check
   * GET /api/v1/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const identities = await this.loader.loadIdentities();
      const credentials = await this.loader.loadCredentials();
      const agents = await this.loader.getAllAgents();

      res.json({
        success: true,
        status: 'healthy',
        service: 'vLEI Verification API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: {
          identitiesLoaded: identities.size,
          credentialsLoaded: credentials.size,
          agentsAvailable: agents.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Helper methods

  private calculateTrustScore(checks: {
    chainValid: boolean;
    edgesValid: boolean;
    credentialCount: number;
    allValid: boolean;
  }): number {
    let score = 0;

    // Chain validity (30 points)
    if (checks.chainValid) score += 30;

    // Edges validity (25 points)
    if (checks.edgesValid) score += 25;

    // Complete chain (20 points)
    if (checks.credentialCount === 5) score += 20;

    // All credentials valid (20 points)
    if (checks.allValid) score += 20;

    // Bonus for perfect (5 points)
    if (checks.chainValid && checks.edgesValid && checks.credentialCount === 5 && checks.allValid) {
      score += 5;
    }

    return Math.min(100, score);
  }

  private getConfidence(trustScore: number): Confidence {
    if (trustScore >= 90) return 'HIGH';
    if (trustScore >= 75) return 'MEDIUM';
    return 'LOW';
  }

  private getRiskLevel(trustScore: number, edgesValid: boolean): RiskLevel {
    if (trustScore < 40) return 'CRITICAL';
    if (trustScore < 60 || !edgesValid) return 'HIGH';
    if (trustScore < 75) return 'MEDIUM';
    return 'LOW';
  }

  private makeRecommendation(trustScore: number, chainValid: boolean): Recommendation {
    if (trustScore >= 90 && chainValid) return 'APPROVED';
    if (trustScore >= 75 && chainValid) return 'APPROVED_WITH_CONDITIONS';
    if (trustScore >= 60) return 'REVIEW_REQUIRED';
    return 'REJECTED';
  }

  private getReasoning(
    chainResult: any,
    edgesResult: any,
    trustScore: number
  ): string[] {
    const reasoning: string[] = [];

    if (chainResult.valid) {
      reasoning.push('Seller has valid 5-credential chain');
    } else {
      reasoning.push('Seller credential chain has issues');
    }

    if (edgesResult.valid) {
      reasoning.push('All credential edges properly linked');
    } else {
      reasoning.push('Some credential edges are invalid');
    }

    if (trustScore >= 90) {
      reasoning.push('High trust score indicates reliable seller');
    } else if (trustScore < 60) {
      reasoning.push('Low trust score indicates potential risks');
    }

    const invalidCreds = chainResult.chain.filter((c: any) => !c.valid);
    if (invalidCreds.length === 0) {
      reasoning.push('No revocations or red flags detected');
    } else {
      reasoning.push(`${invalidCreds.length} credential(s) have issues`);
    }

    return reasoning;
  }

  private getWarnings(chainResult: any, edgesResult: any): string[] {
    const warnings: string[] = [];

    if (!edgesResult.valid) {
      const invalidEdges = edgesResult.edges.filter((e: any) => !e.valid);
      warnings.push(`${invalidEdges.length} credential edge(s) are invalid`);
    }

    if (chainResult.chain.length < 5) {
      warnings.push('Incomplete credential chain detected');
    }

    return warnings;
  }

  private getRedFlags(chainResult: any, edgesResult: any): string[] {
    const redFlags: string[] = [];

    const revokedCreds = chainResult.chain.filter((c: any) => c.reason?.includes('revoked'));
    if (revokedCreds.length > 0) {
      redFlags.push('CRITICAL: One or more credentials revoked');
    }

    if (!chainResult.valid) {
      redFlags.push('CRITICAL: Credential chain verification failed');
    }

    return redFlags;
  }
}
