# FINAL SOLUTION - Following Official vLEI Pattern

## The Official Pattern (from vlei-trainings)

Looking at `103_10_vLEI_Trust_Chain.ipynb`, the official GLEIF pattern is:

```typescript
// Step 1: Issue credential
const { credentialSaid } = await issueCredential(...);

// Step 2: Get the FULL credential from client store
const credential = await client.credentials().get(credentialSaid);

// Step 3: Grant via IPEX
await ipexGrantCredential(..., credential);
```

## Why client.credentials().get()?

The `client.credentials().get()` method returns the **complete** credential structure with all IPEX-required fields:
- `sad`: The ACDC (credential data)
- `iss`: The issuance event (TEL)
- `anc`: The anchor event (KEL)
- `ancatc`: Anchor signatures

The operation response does NOT contain these fields in the right structure.

## The Problem We Had

When witnesses are slow to respond:
1. Credential is issued and SAID is returned ✅
2. But KERIA can't serve it via GET yet ❌  
3. Returns 500 error: `HTTP GET /credentials/{SAID} - 500 Internal Server Error`

## The Solution: Retry Logic

Follow the official pattern BUT add retry logic for witness timing:

```typescript
// Retry up to 10 times with 2-second delays
for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
        await sleep(attempt === 0 ? 1000 : 2000);
        credential = await client.credentials().get(credentialSaid);
        break; // Success!
    } catch (error) {
        if (attempt === maxRetries - 1) {
            throw new Error('Credential not available after retries');
        }
        console.log(`Retry ${attempt + 1}...`);
    }
}
```

## Why This Works

1. ✅ **Follows official GLEIF pattern** - Always uses `client.credentials().get()`
2. ✅ **Handles real-world issues** - Retries when witnesses are slow
3. ✅ **Gets complete data** - Returns full credential with all IPEX fields
4. ✅ **Production-ready** - Gracefully handles timing variations

## Files Changed

**`src/services/keria.service.ts`** - `issueCredential` method:
- Removed fallback to metadata
- Added retry loop with 10 attempts
- 2-second delay between retries
- Clear error messages

## Expected Behavior

### Fast Witnesses (QVI credential)
```
[DEBUG] Credential retrieved from client store
✓ Credential issued
✓ Credential granted via IPEX
```

### Slow Witnesses (LE credential)
```
[WARN] Witnesses have not responded
[DEBUG] Attempt 1 failed: 500 Internal Server Error
[DEBUG] Retry 1/9 - waiting 2000ms...
[DEBUG] Retry 2/9 - waiting 2000ms...
[DEBUG] Credential retrieved from client store on retry 2
✓ Credential issued
✓ Credential granted via IPEX
```

## Build and Test

```bash
npm run build
npm run setup:vlei
```

## Reference

- **Official Training**: `vlei-trainings/jupyter/notebooks/103_10_vLEI_Trust_Chain.ipynb`
- **Pattern**: See Step 2 (LE Credential issuance)
- **Utils**: `vlei-trainings/jupyter/notebooks/scripts_ts/utils.ts` - `issueCredential` function

The key insight: GLEIF's training shows the **ideal** pattern. For production, we add retry logic to handle network/witness variability while maintaining the same core approach.
