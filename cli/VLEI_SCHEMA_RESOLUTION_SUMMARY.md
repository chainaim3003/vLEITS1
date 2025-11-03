# vLEI Schema OOBI Resolution - Implementation Summary

## Problem
The vLEI setup was failing with error:
```
Credential schema EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao not found. 
It must be loaded with data oobi before issuing credentials
```

## Root Cause
The setup was attempting to issue credentials using schemas that had not been resolved via OOBI first. KERIA requires schema OOBIs to be resolved before credentials can be issued.

## Solution Implemented

### 1. Created Schema Configuration (`src/config/vlei-schemas.config.ts`)
Added a configuration file containing:
- vLEI Server URL (default: http://127.0.0.1:7723)
- Standard vLEI Schema definitions with their SAIDs and OOBI URLs:
  - Legal Entity vLEI Credential
  - QVI vLEI Credential  
  - Official Organization Role vLEI Credential

### 2. Extended KERIA Service (`src/services/keria.service.ts`)
Added new method:
```typescript
static async resolveSchemaOOBI(
    client: SignifyClient, 
    schemaOobiUrl: string, 
    schemaName: string
): Promise<void>
```

This method:
- Resolves a schema OOBI URL
- Waits for the operation to complete
- Provides visual feedback via spinner
- Handles errors appropriately

### 3. Updated Setup Command (`src/commands/setup-vlei.command.ts`)
Added **Step 0** before creating any identities:
```typescript
// STEP 0: Resolve Schema OOBIs
ConsoleUtils.section('📋 Step 0: Resolving vLEI Schema OOBIs');
const { client: tempClient } = await KERIAService.createClient(randomPasscode());

// Resolve all three schema OOBIs
await KERIAService.resolveSchemaOOBI(
    tempClient, 
    VLEI_SCHEMA_CONFIG.SCHEMAS.LEGAL_ENTITY_VLEI.OOBI,
    VLEI_SCHEMA_CONFIG.SCHEMAS.LEGAL_ENTITY_VLEI.NAME
);
// ... (QVI and ORG_ROLE schemas)

ConsoleUtils.success('✓ All schema OOBIs resolved');
```

## Prerequisites

### vlei-server Must Be Running
The vLEI schema server must be running on port 7723 before running the setup.

**Start with Docker:**
```bash
docker run -d -p 7723:7723 --name vlei-server weboftrust/vlei-server:latest
```

**Verify it's running:**
```bash
curl http://127.0.0.1:7723/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao
```

## How to Build and Run

### 1. Build the Project
```bash
cd C:\SATHYA\CHAINAIM3003\mcp-servers\stellarboston\vLEI1\vLEITS1\cli
npm run build
```

### 2. Run the Setup
```bash
npm run setup:vlei
```

## Expected Flow

1. ✓ Signify-TS library initialized
2. **📋 Step 0: Resolving vLEI Schema OOBIs** ← NEW STEP
   - ⠋ Resolving schema OOBI: Legal Entity vLEI Credential
   - ⠋ Resolving schema OOBI: QVI vLEI Credential
   - ⠋ Resolving schema OOBI: Official Organization Role vLEI Credential
   - ✓ All schema OOBIs resolved
3. 📋 Step 1: Creating GLEIF ROOT
   - ✔ Created AID: GLEIF_ROOT
   - ✔ Agent role added for GLEIF_ROOT
   - ✔ Registry created
4. 📋 Step 2: Creating QVI
   - ✔ Created AID: QVI
   - ✔ OOBIs resolved
   - ✔ Credential issued ← Should now work!
5. ... (Organizations, Persons, Agents)

## Files Modified

1. **NEW**: `src/config/vlei-schemas.config.ts`
   - Schema configuration with OOBIs

2. **MODIFIED**: `src/services/keria.service.ts`
   - Added `resolveSchemaOOBI()` method

3. **MODIFIED**: `src/commands/setup-vlei.command.ts`
   - Added import for VLEI_SCHEMA_CONFIG
   - Added Step 0 for schema OOBI resolution

4. **NEW**: `VLEI_SETUP_INSTRUCTIONS.md`
   - User guide with prerequisites and troubleshooting

5. **NEW**: `VLEI_SCHEMA_RESOLUTION_SUMMARY.md` (this file)
   - Technical implementation summary

## Testing Checklist

- [ ] vlei-server is running on port 7723
- [ ] Can curl schema OOBI endpoints
- [ ] npm run build completes successfully
- [ ] npm run setup:vlei starts without errors
- [ ] Step 0 completes: "✓ All schema OOBIs resolved"
- [ ] Step 2 QVI credential issuance succeeds
- [ ] Full trust chain is created

## Troubleshooting

### Issue: Schema not found
**Symptom**: Still getting "Credential schema ... not found"  
**Solution**: 
1. Verify vlei-server is running: `curl http://127.0.0.1:7723/oobi/...`
2. Check schema SAIDs match in config file
3. Ensure Step 0 completed successfully

### Issue: Connection refused
**Symptom**: "Error: connect ECONNREFUSED 127.0.0.1:7723"  
**Solution**: Start vlei-server before running setup

### Issue: Wrong schema SAIDs
**Symptom**: Schema OOBI resolution succeeds but credential issuance still fails  
**Solution**: Verify the schema SAIDs in `vlei-schemas.config.ts` match those returned by your vlei-server instance

## Architecture Notes

### Why Use a Temporary Client for Schema Resolution?
We create a temporary client in Step 0 specifically for resolving schema OOBIs. This is because:
1. Schema OOBIs are global and don't belong to any specific identity
2. Any authenticated client can resolve them
3. It keeps the code clean and separates concerns

### Schema OOBI Resolution Flow
```
User runs setup
    ↓
Step 0: Create temp client
    ↓
Resolve Legal Entity schema OOBI
    ↓
Resolve QVI schema OOBI
    ↓
Resolve OOR schema OOBI
    ↓
Schemas now available in KERIA
    ↓
Step 1+: Create identities and issue credentials
```

## Next Steps

After successful setup:
1. Verify all identities in `./data/identities.json`
2. Verify all credentials in `./data/credentials.json`
3. Use issued credentials for vLEI operations
4. Consider building web dashboard for credential management

## References

- KERIA API Documentation
- vLEI Specification
- Signify-TS Library
- vlei-server Repository
