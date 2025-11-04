# CRITICAL ISSUE IDENTIFIED

## Problem
The OOR_AUTH credential implementation is INCORRECT based on the official GLEIF training materials.

## Current (Wrong) Implementation
```typescript
// LE issues OOR_AUTH TO PERSON ❌ WRONG
issueCredential(
    leClient, org.alias, leRegistry, 
    VLEI_SCHEMAS.OOR_AUTH, 
    personPrefix,  // ❌ Wrong issuee
    { 
        AID: personPrefix,  // ❌ Should be empty
        LEI: org.lei,
        personLegalName: person.legalName,
        officialRole: person.officialRole,
        dt: new Date().toISOString()
    }
)
```

## Correct (Official GLEIF) Implementation
```typescript
// LE issues OOR_AUTH TO QVI ✅ CORRECT
issueCredential(
    leClient, org.alias, leRegistry, 
    VLEI_SCHEMAS.OOR_AUTH, 
    qviPrefix,  // ✅ Issued to QVI, not Person!
    { 
        AID: '',  // ✅ Empty string
        LEI: org.lei,
        personLegalName: person.legalName,
        officialRole: person.officialRole,
        dt: new Date().toISOString()
    }
)
```

## What Needs to Change

### 1. OOR_AUTH Issuee
- **Wrong**: Issued to Person
- **Correct**: Issued to QVI

### 2. AID Field
- **Wrong**: `AID: personPrefix`
- **Correct**: `AID: ''` (empty string)

### 3. Flow
**Wrong**:
```
LE → Person (OOR_AUTH)
QVI → Person (OOR with auth edge)
```

**Correct**:
```
LE → QVI (OOR_AUTH authorization)
QVI → Person (OOR with auth edge)
```

## Why This Matters

The OOR_AUTH credential is an **authorization** from the LE to the QVI, giving the QVI permission to issue OOR credentials on behalf of the LE. It's NOT issued to the person!

The schema description says: "A vLEI Authorization Credential issued by a Legal Entity **to a QVI** for the authorization of OOR credentials"

## Reference
See: `C:\SATHYA\CHAINAIM3003\mcp-servers\stellarboston\vLEI1\vLEI1\vlei-trainings\jupyter\notebooks\103_10_vLEI_Trust_Chain.ipynb`

Step 3 shows LE issuing to QVI.
