# Migration Guide: Official GLEIF vLEI Implementation

## Quick Start

To use the official GLEIF flow instead of the previous implementation:

```bash
# Clear old data
npm run cli clear

# Run official GLEIF flow
npm run cli setup-vlei-official
```

## What Changed?

### 1. New Command
- **Old**: `npm run cli setup-vlei`
- **New**: `npm run cli setup-vlei-official` ✨

Both commands are available. The old one is preserved for compatibility.

### 2. Credential Chain

#### Previous Flow (setup-vlei)
```
ROOT → QVI → LE → Person (OOR) → Agent (ECR)
```

#### Official GLEIF Flow (setup-vlei-official) 
```
ROOT → QVI → LE → Person (OOR_AUTH)
       └─────────→ Person (OOR with AUTH edge) → Agent (ECR)
```

### 3. Key Technical Changes

| Component | Previous | Official GLEIF |
|-----------|----------|----------------|
| OOR Issuer | Legal Entity | **QVI** ✅ |
| OOR Registry | LE's registry | **QVI's registry** ✅ |
| OOR Edge | `le` → LE credential | **`auth` → OOR_AUTH** ✅ |
| OOR Attributes | LEI, personLegalName, officialRole | LEI, personLegalName, officialRole, **dt** ✅ |
| Authorization | Implicit | **Explicit (OOR_AUTH credential)** ✅ |

### 4. New Schema: OOR_AUTH

The official GLEIF specification requires an authorization credential:

```typescript
VLEI_SCHEMAS.OOR_AUTH = 'EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E'
```

**Purpose**: Legal Entity explicitly authorizes a person to receive an OOR credential from the QVI.

**Attributes**:
- `AID`: Person's identifier
- `LEI`: Legal Entity's LEI
- `personLegalName`: Person's legal name
- `officialRole`: The official role
- `dt`: Timestamp (required)

### 5. Updated Files

#### New Files ✨
- `src/commands/setup-vlei-official.command.ts` - Official GLEIF implementation
- `OFFICIAL_GLEIF_IMPLEMENTATION.md` - Full documentation

#### Modified Files 📝
- `src/config/vlei-schemas.config.ts` - Added OOR_AUTH schema
- `src/types/vlei.types.ts` - Added OOR_AUTH constant
- `src/index.ts` - Added new CLI command

#### Unchanged Files ✅
- `src/commands/setup-vlei.command.ts` - Original implementation (still works)
- All service files remain the same
- Configuration files unchanged

## Why This Matters

### 1. Compliance ✅
The official GLEIF specification requires:
- QVI as the trust anchor for all organizational roles
- Explicit authorization from Legal Entity (OOR_AUTH)
- Proper credential chain verification

### 2. Interoperability 🔗
Credentials issued with the official flow can be verified by:
- Other GLEIF-compliant systems
- Standard vLEI verification tools
- Third-party validators

### 3. Trust Model 🛡️
The two-step authorization (OOR_AUTH + OOR) provides:
- Legal Entity control over who can represent them
- QVI oversight of all organizational roles
- Clear audit trail

## Running Both Implementations

You can test both approaches:

```bash
# Test original implementation
npm run cli clear
npm run cli setup-vlei

# Test official GLEIF implementation  
npm run cli clear
npm run cli setup-vlei-official
```

## Verification

After running `setup-vlei-official`, verify the chain:

```bash
# List all credentials
npm run cli list-credentials

# You should see:
# 1. QVI credential (issued by ROOT)
# 2. LE credential (issued by QVI)
# 3. OOR_AUTH credentials (issued by LE) 🆕
# 4. OOR credentials (issued by QVI) 🆕
# 5. ECR credentials (issued by Person)
```

## Breaking Changes

❌ **None!** The original `setup-vlei` command still works.

✅ Use `setup-vlei-official` for new deployments that need GLEIF compliance.

## Troubleshooting

### Schema Not Found Error
```
Error: Credential schema EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E not found
```

**Solution**: Ensure vlei-server is running and has the OOR_AUTH schema loaded.

```bash
# Check vlei-server
docker ps | grep vlei-server

# Test schema OOBI
curl http://localhost:7723/oobi/EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E
```

### Credential Chain Verification Failed

**Solution**: Check that:
1. All OOBI connections established
2. OOR_AUTH committed before OOR issuance
3. All required schemas resolved
4. Edge points to correct credential SAID

### Missing `dt` Attribute

**Solution**: The official OOR schema requires a `dt` (timestamp) attribute. This is now included automatically.

## Support

For issues or questions:
1. Check `OFFICIAL_GLEIF_IMPLEMENTATION.md` for detailed documentation
2. Review the credential chain in `./data/credentials.json`
3. Verify schema resolution in logs

## Next Steps

1. ✅ Run `npm run cli setup-vlei-official`
2. ✅ Verify credential chain
3. ✅ Test with actual vLEI verification tools
4. ✅ Deploy to production with confidence

---

**Note**: Both implementations are production-ready. Use `setup-vlei-official` for systems that need to interoperate with the GLEIF vLEI ecosystem.
