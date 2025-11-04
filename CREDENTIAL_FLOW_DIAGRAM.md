# vLEI Credential Flow Comparison

## Visual Comparison

### Previous Implementation (Non-Official)
```
┌──────────┐
│   ROOT   │ Issues QVI Credential
└────┬─────┘
     │
     ▼
┌──────────┐
│   QVI    │ Issues LE Credential
└────┬─────┘
     │
     ▼
┌──────────────────┐
│ Legal Entity (LE)│ Issues OOR Credential (❌ Wrong issuer)
└────┬─────────────┘
     │
     ▼
┌──────────┐
│  Person  │ Issues ECR Credential
└────┬─────┘
     │
     ▼
┌──────────┐
│  Agent   │
└──────────┘

Issues:
❌ LE issues OOR (should be QVI)
❌ No authorization credential
❌ Wrong registry for OOR
❌ Wrong edge in OOR credential
```

### Official GLEIF Implementation ✅
```
┌──────────┐
│   ROOT   │ 1️⃣ Issues QVI Credential
└────┬─────┘
     │
     ▼
┌──────────┐ 2️⃣ Issues LE Credential
│   QVI    │────────────────────────────┐
└────┬─────┘                            │
     │                                  │
     │                            ┌─────▼──────────┐
     │                            │ Legal Entity   │
     │                            │      (LE)      │
     │                            └─────┬──────────┘
     │                                  │
     │                                  │ 3️⃣ Issues OOR_AUTH
     │                                  │    (Authorization)
     │                                  ▼
     │                            ┌──────────┐
     │ 4️⃣ Issues OOR Credential  │  Person  │
     └────────────────────────────▶          │
          (with AUTH edge)        └────┬─────┘
                                       │
                                       │ 5️⃣ Issues ECR
                                       ▼
                                 ┌──────────┐
                                 │  Agent   │
                                 └──────────┘

Benefits:
✅ QVI issues OOR (trust anchor)
✅ LE provides authorization (OOR_AUTH)
✅ Correct registry (QVI's)
✅ Correct edge (AUTH)
✅ GLEIF compliant
```

## Detailed Credential Flow

### Step-by-Step Process

#### 1️⃣ ROOT → QVI Credential
```json
{
  "issuer": "ROOT_PREFIX",
  "issuee": "QVI_PREFIX",
  "schema": "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
  "registry": "ROOT_REGISTRY",
  "attributes": {
    "LEI": "QVI_LEI",
    "dt": "2025-01-01T00:00:00Z"
  }
}
```

#### 2️⃣ QVI → Legal Entity Credential
```json
{
  "issuer": "QVI_PREFIX",
  "issuee": "LE_PREFIX",
  "schema": "ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY",
  "registry": "QVI_REGISTRY",
  "attributes": {
    "LEI": "LE_LEI",
    "dt": "2025-01-01T00:00:00Z"
  },
  "edges": {
    "qvi": {
      "n": "QVI_CREDENTIAL_SAID",
      "s": "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao"
    }
  }
}
```

#### 3️⃣ Legal Entity → OOR_AUTH Credential (🆕 NEW)
```json
{
  "issuer": "LE_PREFIX",
  "issuee": "PERSON_PREFIX",
  "schema": "EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E",
  "registry": "LE_REGISTRY",
  "attributes": {
    "AID": "PERSON_PREFIX",
    "LEI": "LE_LEI",
    "personLegalName": "John Doe",
    "officialRole": "CEO",
    "dt": "2025-01-01T00:00:00Z"
  },
  "edges": {
    "le": {
      "n": "LE_CREDENTIAL_SAID",
      "s": "ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY"
    }
  }
}
```

#### 4️⃣ QVI → OOR Credential (✅ Correct Issuer)
```json
{
  "issuer": "QVI_PREFIX",  // ✅ QVI issues, not LE
  "issuee": "PERSON_PREFIX",
  "schema": "EBNaNu-M9P5cgrnfl2Fvymy4E_jvxxyjb70PRtiANlJy",
  "registry": "QVI_REGISTRY",  // ✅ QVI's registry, not LE's
  "attributes": {
    "LEI": "LE_LEI",
    "personLegalName": "John Doe",
    "officialRole": "CEO",
    "dt": "2025-01-01T00:00:00Z"  // ✅ Required
  },
  "edges": {
    "auth": {  // ✅ Points to AUTH credential, not LE
      "n": "OOR_AUTH_CREDENTIAL_SAID",
      "s": "EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E"
    }
  }
}
```

#### 5️⃣ Person → ECR Credential (Unchanged)
```json
{
  "issuer": "PERSON_PREFIX",
  "issuee": "AGENT_PREFIX",
  "schema": "EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw",
  "registry": "LE_REGISTRY",
  "attributes": {
    "LEI": "LE_LEI",
    "personLegalName": "John Doe",
    "engagementContextRole": "AI Assistant"
  },
  "edges": {
    "oor": {
      "n": "OOR_CREDENTIAL_SAID",
      "s": "EBNaNu-M9P5cgrnfl2Fvymy4E_jvxxyjb70PRtiANlJy"
    }
  }
}
```

## Trust Chain Verification

### Previous Implementation
```
Verifier checks:
1. ROOT issued QVI? ✅
2. QVI issued LE? ✅
3. LE issued OOR? ❌ (Wrong - LE shouldn't issue OOR)
4. Person issued ECR? ✅

Problem: No QVI oversight of organizational roles
```

### Official GLEIF Implementation
```
Verifier checks:
1. ROOT issued QVI? ✅
2. QVI issued LE? ✅
3. LE authorized Person? ✅ (OOR_AUTH)
4. QVI issued OOR? ✅ (Verified against OOR_AUTH)
5. Person issued ECR? ✅

Benefits: Full QVI oversight + LE authorization
```

## Schema Dependencies

### Schema Resolution Order (Important!)

#### For Legal Entity
```
1. QVI Schema (for chain verification)
2. LE Schema (for admission)
3. OOR_AUTH Schema (for issuing)
4. ECR Schema (for future use)
```

#### For Person
```
1. QVI Schema (for chain verification)
2. LE Schema (for chain verification)
3. OOR_AUTH Schema (for admission)
4. OOR Schema (for admission)
5. ECR Schema (for issuing)
```

#### For Agent
```
1. QVI Schema (for chain verification)
2. LE Schema (for chain verification)
3. OOR_AUTH Schema (for chain verification)
4. OOR Schema (for chain verification)
5. ECR Schema (for admission)
```

## Edge Relationships

```
┌─────────────────────────────────────────────────┐
│            Complete Credential Graph            │
└─────────────────────────────────────────────────┘

ROOT_CRED
    ↓ (no edge - root of trust)
QVI_CRED
    ↓ (edge: qvi)
LE_CRED
    ├─→ (edge: le)
    │   OOR_AUTH_CRED
    │       ↓ (edge: auth)
    │   OOR_CRED (issued by QVI!)
    │       ↓ (edge: oor)
    │   ECR_CRED
    │
    └─→ (other OOR_AUTH credentials for other persons...)

Legend:
→  Edge relationship
↓  Issuance relationship
```

## Comparison Table

| Aspect | Previous | Official GLEIF |
|--------|----------|----------------|
| **Credential Count** | 4 per person | **5 per person** |
| **OOR Issuer** | Legal Entity | **QVI** ✅ |
| **Trust Model** | LE-centric | **QVI-centric** ✅ |
| **Authorization** | Implicit | **Explicit (OOR_AUTH)** ✅ |
| **Verification Complexity** | Simple (4 checks) | **Robust (5 checks)** ✅ |
| **GLEIF Compliance** | ❌ Non-compliant | **✅ Compliant** |
| **Interoperability** | Limited | **Full** ✅ |
| **Audit Trail** | Incomplete | **Complete** ✅ |

## Key Takeaways

1. **QVI is the Trust Anchor**: All organizational roles must be issued by QVI
2. **LE Provides Authorization**: Through OOR_AUTH credential
3. **Two-Step Process**: Authorization (OOR_AUTH) + Issuance (OOR)
4. **Proper Registry**: OOR credentials live in QVI's registry
5. **Correct Edge**: OOR points to "auth" (OOR_AUTH), not "le" (LE credential)
6. **Required Timestamp**: OOR credentials must include "dt" attribute

## Migration Path

```
Old System              Migration              New System
(non-compliant)                               (GLEIF-compliant)

setup-vlei          →   clear data      →   setup-vlei-official
    ↓                       ↓                       ↓
4 credentials          clean slate         5 credentials
    ↓                       ↓                       ↓
LE issues OOR       no breaking changes     QVI issues OOR
    ↓                       ↓                       ↓
Non-compliant          both work           GLEIF compliant
```

---

**Documentation Date**: 2025-01-01  
**Schema Version**: GLEIF v1.0.0  
**Implementation**: Official GLEIF Specification
