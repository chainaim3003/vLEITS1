# vLEI TypeScript CLI - Fixed Schema Resolution Issue

## ✅ Problem Solved

The credential schema error has been fixed! The setup was failing because schema OOBIs weren't being resolved before attempting to issue credentials.

## 🔧 What Was Fixed

1. **Added Schema Configuration** (`src/config/vlei-schemas.config.ts`)
   - Centralized schema OOBI URLs and SAIDs

2. **Extended KERIA Service** (`src/services/keria.service.ts`)
   - Added `resolveSchemaOOBI()` method

3. **Updated Setup Flow** (`src/commands/setup-vlei.command.ts`)
   - Added Step 0 to resolve all schema OOBIs before creating identities

## 🚀 Quick Start

### Prerequisites

**1. Start vlei-server**
```bash
docker run -d -p 7723:7723 --name vlei-server weboftrust/vlei-server:latest
```

**2. Verify it's running**
```bash
curl http://127.0.0.1:7723/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao
```

### Run Setup

**Option 1: Quick Start (Recommended)**
```bash
# Windows
quickstart.bat

# Linux/Mac
chmod +x quickstart.sh
./quickstart.sh
```

**Option 2: Manual**
```bash
npm run build
npm run setup:vlei
```

## 📊 Expected Output

```
🚀 vLEI Multi-Organization Setup
Creating vLEI trust chain for 2 organization(s)...

✓ Signify-TS library initialized

📋 Step 0: Resolving vLEI Schema OOBIs
⠋ Resolving schema OOBI: Legal Entity vLEI Credential
✔ Schema OOBI resolved: Legal Entity vLEI Credential
⠋ Resolving schema OOBI: QVI vLEI Credential
✔ Schema OOBI resolved: QVI vLEI Credential
⠋ Resolving schema OOBI: Official Organization Role vLEI Credential
✔ Schema OOBI resolved: Official Organization Role vLEI Credential
✓ All schema OOBIs resolved
  You can continue ✅

📋 Step 1: Creating GLEIF ROOT
⠋ Creating AID: GLEIF_ROOT
✔ Created AID: GLEIF_ROOT (EAXyiBx2QAVc62tQ9PPHNA60AXB2s8DhrrQXdfuj9FnL)
✔ Agent role added for GLEIF_ROOT
✔ Registry created: EKNwQTwU2HFAcvuUanpJsC2DDbw9iXv7AyhrPCCMi8cH
✓ GLEIF ROOT: EAXyiBx2QAVc62tQ9PPHNA60AXB2s8DhrrQXdfuj9FnL
  You can continue ✅

📋 Step 2: Creating QVI
✔ Created AID: QVI (EGoFgaNSkFDWEAKp8w6X_n0V20RRwLaiuFt_SB34SBeZ)
✔ Agent role added for QVI
✔ Registry created: EPvEHAbTB2fYkdVrUshG3tOubyE3VmpAy34A03Sl6vaV
✔ OOBI resolved for QVI_Contact
✔ OOBI resolved for ROOT_Contact
⠋ Issuing credential from GLEIF_ROOT
✔ Credential issued: EKYGnKrjLvavKORjHzz8y5LDPy2gHnXnKzaZgZnp9_TM  ← NOW WORKS! ✅
...
```

## 📁 New Files Created

1. `src/config/vlei-schemas.config.ts` - Schema configuration
2. `VLEI_SETUP_INSTRUCTIONS.md` - Detailed user guide
3. `VLEI_SCHEMA_RESOLUTION_SUMMARY.md` - Technical implementation details
4. `quickstart.sh` / `quickstart.bat` - Quick start scripts
5. `README_FIXED.md` - This file

## 🔍 Files Modified

1. `src/services/keria.service.ts` - Added schema resolution method
2. `src/commands/setup-vlei.command.ts` - Added Step 0 for schema resolution

## 🛠️ Troubleshooting

### "Schema not found" Error Still Appearing?

1. **Check vlei-server is running:**
   ```bash
   curl http://127.0.0.1:7723/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao
   ```

2. **Verify Step 0 completed:**
   Look for "✓ All schema OOBIs resolved" in the output

3. **Check schema SAIDs:**
   The SAIDs in `src/config/vlei-schemas.config.ts` must match those served by your vlei-server

### Connection Refused Error?

Start vlei-server before running setup:
```bash
docker run -d -p 7723:7723 --name vlei-server weboftrust/vlei-server:latest
```

### Build Errors?

```bash
# Clean and rebuild
rm -rf build node_modules
npm install
npm run build
```

## 📚 Documentation

- `VLEI_SETUP_INSTRUCTIONS.md` - User-friendly setup guide
- `VLEI_SCHEMA_RESOLUTION_SUMMARY.md` - Technical implementation details
- `config.example` - Example configuration

## ✨ What's Next?

After successful setup:

1. **Verify the data:**
   ```bash
   cat data/identities.json
   cat data/credentials.json
   ```

2. **Use the credentials:**
   - Implement credential presentation
   - Build verification workflows
   - Create web dashboard

3. **Add more organizations:**
   Edit `config.json` and run setup again

## 🎯 Success Criteria

✅ vlei-server running on port 7723  
✅ Schema OOBIs resolved in Step 0  
✅ GLEIF ROOT created  
✅ QVI credential issued successfully  
✅ Legal Entity credentials issued  
✅ Person and Agent credentials issued  
✅ Data saved to `./data/` directory

## 📞 Support

If you encounter issues:
1. Check the logs for error messages
2. Review `VLEI_SETUP_INSTRUCTIONS.md` for common solutions
3. Verify all prerequisites are met
4. Check that KERIA is running properly

---

**The schema resolution issue is now fixed! 🎉**

You can now successfully run the complete vLEI setup with all credential issuances working properly.
