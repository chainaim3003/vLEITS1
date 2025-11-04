/**
 * vLEI TypeScript Type Definitions
 * Following official GLEIF specifications
 */

export interface VLEIIdentity {
    alias: string;
    prefix: string;
    lei?: string;
    role?: string;
    type: 'root' | 'qvi' | 'legal-entity' | 'person' | 'agent';
    registry?: string;
    oobis: string[];
    createdAt: string;
}

export interface VLEICredential {
    said: string;
    type: string;
    issuer: string;
    issuee: string;
    schema: string;
    registry: string;
    status: 'issued' | 'revoked';
    lei?: string;
    attributes: any;
    edges?: any;
    rules?: any;
    issuedAt: string;
}

export interface CredentialRegistry {
    name: string;
    identifier: string;
    aidAlias: string;
    aidPrefix: string;
    createdAt: string;
}

export interface OOBIConnection {
    alias: string;
    oobi: string;
    contactAlias: string;
    resolvedAt: string;
}

// GLEIF vLEI Schema SAIDs (from official specs)
export const VLEI_SCHEMAS = {
    // QVI credential schema
    QVI: 'EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao',
    // Legal Entity vLEI credential schema  
    LEGAL_ENTITY: 'ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY',
    // Official Organizational Role credential schema
    OOR: 'EBNaNu-M9P5cgrnfl2Fvymy4E_jvxxyjb70PRtiANlJy',
    // OOR Authorization credential schema 
    OOR_AUTH: 'EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E',
    // Engagement Context Role credential schema (for AI agents)
    ECR: 'EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw'
};

export interface VLEISetupOptions {
    rootName?: string;
    qviName?: string;
    legalEntityName?: string;
    legalEntityLEI?: string;
    personName?: string;
    agentName?: string;
}
