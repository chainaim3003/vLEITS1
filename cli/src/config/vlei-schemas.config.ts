// vLEI Schema Configuration
// Using Docker vlei-server with internal Docker network name

export const VLEI_SCHEMA_CONFIG = {
    // vlei-server via Docker internal network
    // When KERIA is in Docker, it must use the service name 'vlei-server'
    // not 'localhost' (which would be the container itself)
    SCHEMA_SERVER_URL: 'http://vlei-server:7723',
    
    SCHEMAS: {
        // QVI vLEI Credential Schema
        QVI_VLEI: {
            SAID: 'EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao',
            NAME: 'QVI vLEI Credential',
            OOBI: 'http://vlei-server:7723/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao'
        },
        // Legal Entity vLEI Credential Schema
        LEGAL_ENTITY_VLEI: {
            SAID: 'ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY',
            NAME: 'Legal Entity vLEI Credential',
            OOBI: 'http://vlei-server:7723/oobi/ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY'
        },
        // Official Organization Role vLEI Credential Schema
        ORG_ROLE_VLEI: {
            SAID: 'EBNaNu-M9P5cgrnfl2Fvymy4E_jvxxyjb70PRtiANlJy',
            NAME: 'Official Organization Role vLEI Credential',
            OOBI: 'http://vlei-server:7723/oobi/EBNaNu-M9P5cgrnfl2Fvymy4E_jvxxyjb70PRtiANlJy'
        },
        // OOR Authorization vLEI Credential Schema (issued by Legal Entity to authorize OOR issuance)
        OOR_AUTH_VLEI: {
            SAID: 'EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E',
            NAME: 'OOR Authorization vLEI Credential',
            OOBI: 'http://vlei-server:7723/oobi/EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E'
        },
        // Engagement Context Role vLEI Credential Schema (for AI Agents)
        ECR_VLEI: {
            SAID: 'EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw',
            NAME: 'Engagement Context Role vLEI Credential',
            OOBI: 'http://vlei-server:7723/oobi/EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw'
        }
    }
};
