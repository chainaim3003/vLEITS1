// API Type Definitions for vLEI Verification API

export type IdentifierType = 'alias' | 'aid' | 'email' | 'lei';
export type VerificationLevel = 'basic' | 'standard' | 'comprehensive';
export type Recommendation = 'APPROVED' | 'APPROVED_WITH_CONDITIONS' | 'REVIEW_REQUIRED' | 'REJECTED' | 'BLOCKED';
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// Request types
export interface SellerVerificationRequest {
  sellerIdentifier: string;
  identifierType: IdentifierType;
}

export interface TradingPartnerVerificationRequest {
  seller: {
    identifier: string;
    identifierType: IdentifierType;
  };
  buyer?: {
    identifier: string;
    identifierType: IdentifierType;
  };
  transaction?: {
    type?: string;
    value?: number;
    currency?: string;
    riskLevel?: RiskLevel;
  };
  verificationLevel?: VerificationLevel;
}

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface Decision {
  approved: boolean;
  confidence: Confidence;
  trustScore: number;
  riskLevel: RiskLevel;
  recommendation: Recommendation;
  reasoning: string[];
}

export interface TradingPartnerVerificationResponse {
  success: boolean;
  timestamp: string;
  verificationId: string;
  decision: Decision;
  seller: {
    agent: {
      alias: string;
      aid: string;
      name: string;
      role: string;
    };
    company: {
      name: string;
      lei: string;
    };
    credentials: {
      [key: string]: {
        type: string;
        said: string;
        status: string;
        valid: boolean;
      };
    };
    chainVerification: {
      complete: boolean;
      valid: boolean;
      credentialCount: number;
      allCredentialsValid: boolean;
    };
  };
  warnings: string[];
  redFlags: string[];
}
