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
export declare const VLEI_SCHEMAS: {
    QVI: string;
    LEGAL_ENTITY: string;
    OOR: string;
    ECR: string;
};
export interface VLEISetupOptions {
    rootName?: string;
    qviName?: string;
    legalEntityName?: string;
    legalEntityLEI?: string;
    personName?: string;
    agentName?: string;
}
//# sourceMappingURL=vlei.types.d.ts.map