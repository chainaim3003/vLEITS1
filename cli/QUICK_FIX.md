# QUICK FIX REFERENCE

## The Error
```
✗ Setup failed: Cannot use 'in' operator to search for 'v' in undefined
```

## The Root Cause
After issuing a credential, you tried to use it directly from the operation response, but the operation response doesn't contain all IPEX-required fields (`sad`, `iss`, `anc`, `ancatc`).

## The Fix (2 Changes)

### Change 1: In `issueCredential` method
Replace this:
```typescript
const credential = completed.response || completed.metadata;
return { said: credentialSaid, credential };
```

With this:
```typescript
await sleep(1000); // Let KERIA store the credential
const credential = await client.credentials().get(credentialSaid);
return { said: credentialSaid, credential };
```

### Change 2: In `grantCredential` method
Add validation at the start:
```typescript
if (!acdc) throw new Error('Credential object is undefined');
if (!acdc.sad) throw new Error('Credential.sad is undefined');
if (!acdc.iss) throw new Error('Credential.iss is undefined');
if (!acdc.anc) throw new Error('Credential.anc is undefined');
if (!acdc.ancatc) throw new Error('Credential.ancatc is undefined');
```

And change:
```typescript
acdc: new Serder(acdc?.sad),  // From optional
```
To:
```typescript
acdc: new Serder(acdc.sad),   // To direct access
```

## Why It Works
- `client.credentials().get()` retrieves the COMPLETE credential with all IPEX fields
- The operation response only has partial data
- This is the official pattern from GLEIF vLEI training

## Test It
```bash
npm run build
npm run setup:vlei
```

## Success Output
```
✓ Credential issued: [SAID]
[DEBUG]   - has sad: true
[DEBUG]   - has iss: true  
[DEBUG]   - has anc: true
[DEBUG]   - has ancatc: true
✓ Credential granted via IPEX
```

## Files Modified
- `src/services/keria.service.ts` (2 methods: `issueCredential`, `grantCredential`)

## Reference
Official training: `vlei-trainings/jupyter/notebooks/102_20_KERIA_Signify_Credential_Issuance.ipynb`
