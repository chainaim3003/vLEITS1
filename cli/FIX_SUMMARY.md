# vLEI IPEX Grant Error Fix

## Problem
The error `Cannot use 'in' operator to search for 'v' in undefined` occurred during the IPEX grant operation after credential issuance. This happened because the credential object passed to `grantCredential()` was missing required fields (`sad`, `iss`, `anc`, `ancatc`).

## Root Cause
After issuing a credential, the code was trying to use the credential directly from the operation response/metadata, but this doesn't contain all the necessary fields for IPEX grant. According to the official vLEI training examples (see `102_20_KERIA_Signify_Credential_Issuance.ipynb`), you must **retrieve the full credential from the client's local store** after issuance.

## Solution Applied

### 1. Fixed `issueCredential` method in `keria.service.ts`

**Before:**
```typescript
// Get the credential from the operation response
const credential = completed.response || completed.metadata;
```

**After:**
```typescript
// Retrieve the full credential from the client's local store
// This is necessary to get all fields (sad, iss, anc, ancatc) for IPEX
await sleep(1000); // Brief delay to ensure credential is stored
const credential = await client.credentials().get(credentialSaid);
```

**Why this works:**
- The operation response only contains partial credential data
- `client.credentials().get()` retrieves the full credential with all IPEX-required fields:
  - `sad`: The ACDC (credential) itself
  - `iss`: The issuance event from the credential registry (TEL event)
  - `anc`: The KEL event anchoring the TEL issuance event
  - `ancatc`: Signatures for the KEL anchoring event

### 2. Enhanced `grantCredential` method with validation

Added validation to check all required fields before attempting IPEX grant:

```typescript
// Validate that all required fields are present
if (!acdc) throw new Error('Credential object is undefined');
if (!acdc.sad) throw new Error('Credential.sad is undefined');
if (!acdc.iss) throw new Error('Credential.iss is undefined');
if (!acdc.anc) throw new Error('Credential.anc is undefined');
if (!acdc.ancatc) throw new Error('Credential.ancatc is undefined');
```

This provides clear error messages if any required field is missing.

## Reference Implementation
The fix follows the pattern from the official GLEIF vLEI training materials:
- **File**: `vlei-trainings/jupyter/notebooks/102_20_KERIA_Signify_Credential_Issuance.ipynb`
- **Section**: Step 3 (Issue the ACDC) and Step 4 (Issuer Grants Credential via IPEX)

## How to Test

1. Rebuild the project:
```bash
cd C:\SATHYA\CHAINAIM3003\mcp-servers\stellarboston\vLEI1\vLEITS1\cli
npm run build
```

2. Run the setup:
```bash
npm run setup:vlei
```

The credential issuance and IPEX grant should now complete successfully.

## Expected Output
```
✓ Credential issued: [SAID]
✓ Credential granted via IPEX
```

## Additional Notes
- The 1-second sleep gives KERIA time to store the credential in its database
- This is a common pattern in async operations with KERIA
- The credential must be fully processed before attempting IPEX operations
