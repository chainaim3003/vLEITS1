"use strict";
// Local vLEI Schema Definitions
// Schemas from WebOfTrust/vLEI GitHub repository
// These are the official GLEIF vLEI credential schemas
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCAL_VLEI_SCHEMAS = void 0;
exports.LOCAL_VLEI_SCHEMAS = {
    // QVI vLEI Credential Schema (from GLEIF)
    QVI: {
        "$id": "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Qualified vLEI Issuer vLEI Credential",
        "description": "A vLEI Credential issued by GLEIF to Qualified vLEI Issuers",
        "type": "object",
        "credentialType": "QualifiedvLEIIssuervLEICredential"
    },
    // Legal Entity vLEI Credential Schema (from GLEIF)  
    LEGAL_ENTITY: {
        "$id": "ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Legal Entity vLEI Credential",
        "description": "A vLEI Credential issued by a Qualified vLEI issuer to a Legal Entity",
        "type": "object",
        "credentialType": "LegalEntityvLEICredential"
    },
    // Official Organization Role vLEI Credential Schema (from GLEIF)
    OOR: {
        "$id": "EH6ekLjSr8V32WyFbGe1zXjTzFs9PkTYmupJ9H65O14g",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Legal Entity Official Organizational Role vLEI Credential",
        "description": "A vLEI Role Credential issued by a Legal Entity to a Person",
        "type": "object",
        "credentialType": "LegalEntityOfficialOrganizationalRolevLEICredential"
    },
    // Engagement Context Role vLEI Credential Schema (from GLEIF)
    ECR: {
        "$id": "EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Legal Entity Engagement Context Role vLEI Credential",
        "description": "A vLEI Role Credential issued by a Legal Entity or Person to a Person",
        "type": "object",
        "credentialType": "LegalEntityEngagementContextRolevLEICredential"
    }
};
//# sourceMappingURL=local-schemas.config.js.map