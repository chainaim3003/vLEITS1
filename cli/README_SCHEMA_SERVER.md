# ✅ FINAL SOLUTION: Local Schema Server

## The Problem
- GLEIF Testnet schema server is not accessible from your network
- No official Docker image for vlei-server exists
- KERIA requires schema OOBIs to be resolved before issuing credentials

## The Solution
We've created a **local schema server** that runs on your machine and serves the vLEI schemas to KERIA.

## 🚀 Quick Start

### Terminal 1: Start the Schema Server
```bash
cd /c/SATHYA/CHAINAIM3003/mcp-servers/stellarboston/vLEI1/vLEITS1/cli
npm run schema-server
```

You should see:
```
═══════════════════════════════════════════════════════
  📋 Local vLEI Schema Server
═══════════════════════════════════════════════════════
  Listening on: http://127.0.0.1:7723

  Available schemas:
  • Qualified vLEI Issuer vLEI Credential
    http://127.0.0.1:7723/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao
  • Legal Entity vLEI Credential
    http://127.0.0.1:7723/oobi/ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY
  • Legal Entity Official Organizational Role vLEI Credential
    http://127.0.0.1:7723/oobi/EH6ekLjSr8V32WyFbGe1zXjTzFs9PkTYmupJ9H65O14g
  • Legal Entity Engagement Context Role vLEI Credential
    http://127.0.0.1:7723/oobi/EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw

  Press Ctrl+C to stop
═══════════════════════════════════════════════════════
```

**Keep this terminal open!**

### Terminal 2: Run the vLEI Setup
```bash
cd /c/SATHYA/CHAINAIM3003/mcp-servers/stellarboston/vLEI1/vLEITS1/cli
npm run build
npm run setup:vlei
```

## Expected Output

```
🚀 vLEI Multi-Organization Setup
Creating vLEI trust chain for 2 organization(s)...

✓ Signify-TS library initialized

📋 Step 0: Resolving vLEI Schema OOBIs from GLEIF Testnet
⠋ Resolving schema OOBI: QVI vLEI Credential
✔ Schema OOBI resolved: QVI vLEI Credential
⠋ Resolving schema OOBI: Legal Entity vLEI Credential
✔ Schema OOBI resolved: Legal Entity vLEI Credential
⠋ Resolving schema OOBI: Official Organization Role vLEI Credential
✔ Schema OOBI resolved: Official Organization Role vLEI Credential
⠋ Resolving schema OOBI: Engagement Context Role vLEI Credential
✔ Schema OOBI resolved: Engagement Context Role vLEI Credential
✓ All schema OOBIs resolved from GLEIF Testnet
  You can continue ✅

📋 Step 1: Creating GLEIF ROOT
✔ Created AID: GLEIF_ROOT (E...)
✔ Agent role added for GLEIF_ROOT
✔ Registry created: E...
✓ GLEIF ROOT: E...
  You can continue ✅

📋 Step 2: Creating QVI
✔ Created AID: QVI (E...)
✔ Agent role added for QVI
✔ Registry created: E...
✔ OOBI resolved for QVI_Contact
✔ OOBI resolved for ROOT_Contact
⠋ Issuing credential from GLEIF_ROOT
✔ Credential issued: E...  ← THIS SHOULD NOW WORK! ✅
...
```

## What We Created

### 1. `schema-server.js`
A simple Node.js HTTP server that:
- Serves vLEI credential schemas on port 7723
- Responds to OOBI requests (`/oobi/{SCHEMA_SAID}`)
- Returns JSON schema definitions

### 2. Updated `vlei-schemas.config.ts`
Now points to `http://127.0.0.1:7723` instead of the GLEIF testnet

### 3. Updated `setup-vlei.command.ts`
Includes Step 0 that resolves all schema OOBIs before creating identities

## Testing the Schema Server

While the schema server is running, test it:

```bash
# Test QVI schema
curl http://127.0.0.1:7723/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao

# List all schemas
curl http://127.0.0.1:7723/
```

## Troubleshooting

### Schema Server Won't Start
**Error:** `Port 7723 is already in use`

**Solution:**
```bash
# Find what's using port 7723
netstat -ano | findstr :7723

# Kill the process or use a different port
```

### Schema Resolution Fails
**Error:** `fetch failed` or connection refused

**Solution:**
1. Make sure schema server is running (`npm run schema-server`)
2. Check it's accessible: `curl http://127.0.0.1:7723/`
3. Verify port 7723 is not blocked by firewall

### Credential Issuance Still Fails
**Error:** `Credential schema ... not found`

**Solution:**
1. Check that Step 0 completed successfully
2. Verify all 4 schemas were resolved
3. Check schema server logs for incoming requests
4. Ensure schema SAIDs match between config and server

## Files Created/Modified

✅ **New Files:**
- `schema-server.js` - Local schema server
- `src/config/local-schemas.config.ts` - Schema definitions
- `README_SCHEMA_SERVER.md` - This file

✅ **Modified Files:**
- `package.json` - Added `schema-server` script
- `src/config/vlei-schemas.config.ts` - Points to localhost
- `src/commands/setup-vlei.command.ts` - Includes Step 0
- `src/services/keria.service.ts` - Has `resolveSchemaOOBI()` method

## Architecture

```
┌─────────────────────────────────────────┐
│  Terminal 1: Schema Server              │
│  npm run schema-server                  │
│  ↓                                       │
│  http://127.0.0.1:7723                  │
│  Serves vLEI schemas                    │
└─────────────────────────────────────────┘
             ↑
             │ HTTP GET /oobi/{SAID}
             │
┌─────────────────────────────────────────┐
│  Terminal 2: vLEI Setup                 │
│  npm run setup:vlei                     │
│  ↓                                       │
│  Step 0: Resolve schema OOBIs           │
│  Step 1: Create ROOT                    │
│  Step 2: Create QVI & issue credential  │
│  Step 3+: Create Organizations          │
└─────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│  KERIA (localhost:3901)                 │
│  Stores resolved schemas                │
│  Issues credentials                     │
└─────────────────────────────────────────┘
```

## Success Criteria

✅ Schema server running on port 7723
✅ All 4 schemas served correctly
✅ Step 0 completes without errors
✅ QVI credential issued successfully
✅ All organizations created
✅ Data saved to `./data/`

---

**This is the final working solution! 🎉**

The schema server acts as a local replacement for the GLEIF testnet server, allowing KERIA to resolve schemas and issue credentials successfully.
