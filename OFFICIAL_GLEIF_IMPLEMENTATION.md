# Official GLEIF vLEI Implementation

## Overview
This implementation follows the **official GLEIF vLEI specification** for issuing Official Organizational Role (OOR) credentials.

## Key Changes from Previous Implementation

### Previous Flow (Incorrect)
```
ROOT → QVI → Legal Entity → Person (OOR)
                         └→ Agent (ECR)
```

### Official GLEIF Flow (Correct)
```
ROOT → QVI → Legal Entity → Person (OOR_AUTH)
       └──────────────────→ Person (OOR with AUTH edge)
                         └→ Agent (ECR)
```

## Credential Chain Details

### 1. ROOT issues QVI Credential
- **Issuer**: ROOT
- **Issuee**: QVI
- **Schema**: `EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao`
- **Registry**: ROOT's registry

### 2. QVI issues Legal Entity Credential
- **Issuer**: QVI
- **Issuee**: Legal Entity
- **Schema**: `ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY`
- **Registry**: QVI's registry
- **Edge**: Points to QVI credential

### 3. Legal Entity issues OOR Authorization (OOR_AUTH) Credential
- **Issuer**: Legal Entity
- **Issuee**: Person
- **Schema**: `EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E` (**NEW**)
- **Registry**: Legal Entity's registry
- **Edge**: Points to Legal Entity credential
- **Purpose**: Authorizes the person to receive an OOR credential
- **Required Attributes**:
  - `AID`: Person's AID
  - `LEI`: Legal Entity's LEI
  - `personLegalName`: Person's legal name
  - `officialRole`: The official role
  - `dt`: Timestamp (ISO format)

### 4. QVI issues Official Organizational Role (OOR) Credential
- **Issuer**: QVI (**CHANGED**: was Legal Entity before)
- **Issuee**: Person
- **Schema**: `EBNaNu-M9P5cgrnfl2Fvymy4E_jvxxyjb70PRtiANlJy`
- **Registry**: QVI's registry (**CHANGED**: was LE's registry before)
- **Edge**: Points to OOR_AUTH credential (**CHANGED**: was LE credential before)
- **Edge Name**: `auth` (**CHANGED**: was `le` before)
- **Required Attributes**:
  - `LEI`: Legal Entity's LEI
  - `personLegalName`: Person's legal name
  - `officialRole`: The official role
  - `dt`: Timestamp (ISO format) (**REQUIRED**)

### 5. Person issues Engagement Context Role (ECR) Credential
- **Issuer**: Person
- **Issuee**: Agent
- **Schema**: `EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw`
- **Registry**: Legal Entity's registry
- **Edge**: Points to OOR credential

## Why This Change?

The official GLEIF specification requires:

1. **Trust Anchor**: The QVI (Qualified vLEI Issuer) maintains the trust anchor for all organizational roles
2. **Authorization Layer**: The Legal Entity provides authorization (OOR_AUTH) but doesn't issue the actual OOR credential
3. **Verification**: Verifiers can check:
   - The OOR credential is issued by a trusted QVI
   - The Legal Entity authorized this specific person (via OOR_AUTH)
   - The entire chain back to ROOT is valid

## Implementation Files

### New Files
- `setup-vlei-official.command.ts` - Official GLEIF flow implementation

### Updated Files
- `vlei-schemas.config.ts` - Added OOR_AUTH schema
- `vlei.types.ts` - Added OOR_AUTH constant

## Schema Information

### OOR Authorization Schema (OOR_AUTH)
```json
{
  "SAID": "EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E",
  "Name": "OOR Authorization vLEI Credential",
  "OOBI": "http://vlei-server:7723/oobi/EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E"
}
```

### OOR Schema
According to the official schema from GLEIF:
- **Issuer field**: `i` - "QVI Issuer AID" (not Legal Entity)
- **Required edge**: `auth` - Points to OOR_AUTH credential with schema `EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E`
- **Required attributes**: Must include `dt` (timestamp)

## Usage

```bash
# Run the official GLEIF flow
npm run cli setup-vlei-official

# Or use the CLI directly
ts-node src/index.ts setup-vlei-official
```

## Verification

To verify the credential chain:

1. **Check OOR_AUTH**: Issued by Legal Entity to Person
2. **Check OOR**: Issued by QVI to Person with `auth` edge pointing to OOR_AUTH
3. **Check ECR**: Issued by Person to Agent with `oor` edge pointing to OOR
4. **Verify Chain**: ROOT → QVI → LE (LE → Person (OOR_AUTH)) → QVI → Person (OOR) → Agent (ECR)

## Key Points

1. **QVI is the trust anchor** for OOR credentials, not the Legal Entity
2. **Legal Entity authorizes** via OOR_AUTH credential
3. **Person must establish OOBI connections** with both LE and QVI
4. **Schema resolution order matters** - all schemas in the chain must be resolved
5. **Timing matters** - wait for OOR_AUTH to be committed before QVI issues OOR

## Differences Summary

| Aspect | Previous Implementation | Official GLEIF Implementation |
|--------|------------------------|-------------------------------|
| OOR Issuer | Legal Entity | QVI |
| OOR Registry | LE Registry | QVI Registry |
| OOR Edge Name | `le` | `auth` |
| OOR Edge Target | LE Credential | OOR_AUTH Credential |
| Authorization | Implicit | Explicit (OOR_AUTH) |
| Credential Count | 4 per person | 5 per person |

## Testing Checklist

- [ ] ROOT can issue QVI credential
- [ ] QVI can issue LE credential with QVI edge
- [ ] LE can issue OOR_AUTH credential with LE edge
- [ ] QVI can issue OOR credential with AUTH edge
- [ ] Person can issue ECR credential with OOR edge
- [ ] All schemas resolve correctly
- [ ] All OOBI connections work
- [ ] Credential chain verifies correctly
- [ ] All required attributes present (including `dt`)

## Troubleshooting

### "Schema not found" error
- Ensure vlei-server is running
- Check that all schemas are loaded in vlei-server
- Verify OOBI URLs are correct

### "Credential not found" error  
- Wait longer between credential issuances
- Check that previous credential was admitted
- Verify OOBI connections are established

### "Invalid edge" error
- Ensure edge points to correct credential SAID
- Verify edge schema SAID matches credential schema
- Check edge name matches schema requirement (`auth` for OOR)

## References

- Official OOR Schema: http://vlei-server:7723/oobi/EBNaNu-M9P5cgrnfl2Fvymy4E_jvxxyjb70PRtiANlJy
- Official OOR_AUTH Schema: http://vlei-server:7723/oobi/EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E
- GLEIF vLEI Ecosystem: https://www.gleif.org/vlei
