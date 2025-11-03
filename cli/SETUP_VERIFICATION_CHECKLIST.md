# vLEI Setup Verification Checklist

## Pre-Setup Checklist

### Environment Setup
- [ ] Node.js installed (v16 or higher)
- [ ] npm installed
- [ ] Docker installed (if using Docker for vlei-server)
- [ ] Git Bash or similar terminal (for Windows users)

### KERIA Setup
- [ ] KERIA is running
- [ ] KERIA Admin API accessible at http://localhost:3901
- [ ] KERIA Boot API accessible at http://localhost:3903

### vlei-server Setup
- [ ] vlei-server is installed
- [ ] vlei-server is running on port 7723
- [ ] Can access schema OOBI: 
  ```bash
  curl http://127.0.0.1:7723/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao
  ```

### Project Setup
- [ ] Project dependencies installed: `npm install`
- [ ] config.json exists and is properly configured
- [ ] Build directory is clean

## Build Verification

- [ ] Run `npm run build`
- [ ] Build completes without errors
- [ ] `build/` directory is created
- [ ] TypeScript files compiled to JavaScript

## Setup Execution Checklist

### Step 0: Schema Resolution
- [ ] "📋 Step 0: Resolving vLEI Schema OOBIs" appears
- [ ] "⠋ Resolving schema OOBI: Legal Entity vLEI Credential" appears
- [ ] "✔ Schema OOBI resolved: Legal Entity vLEI Credential" appears
- [ ] "⠋ Resolving schema OOBI: QVI vLEI Credential" appears
- [ ] "✔ Schema OOBI resolved: QVI vLEI Credential" appears
- [ ] "⠋ Resolving schema OOBI: Official Organization Role vLEI Credential" appears
- [ ] "✔ Schema OOBI resolved: Official Organization Role vLEI Credential" appears
- [ ] "✓ All schema OOBIs resolved" appears
- [ ] No errors in Step 0

### Step 1: GLEIF ROOT
- [ ] "📋 Step 1: Creating GLEIF ROOT" appears
- [ ] "✔ Created AID: GLEIF_ROOT" appears with prefix
- [ ] "✔ Agent role added for GLEIF_ROOT" appears
- [ ] "✔ Registry created:" appears with registry SAID
- [ ] "✓ GLEIF ROOT:" appears with prefix
- [ ] No errors in Step 1

### Step 2: QVI
- [ ] "📋 Step 2: Creating QVI" appears
- [ ] "✔ Created AID: QVI" appears with prefix
- [ ] "✔ Agent role added for QVI" appears
- [ ] "✔ Registry created:" appears with registry SAID
- [ ] "✔ OOBI resolved for QVI_Contact" appears
- [ ] "✔ OOBI resolved for ROOT_Contact" appears
- [ ] "⠋ Issuing credential from GLEIF_ROOT" appears
- [ ] "✔ Credential issued:" appears with credential SAID (NO ERROR!)
- [ ] "⠋ Granting credential via IPEX" appears
- [ ] "✔ Credential granted via IPEX" appears
- [ ] "⠋ Waiting for grant notification" appears
- [ ] "✔ Grant notification received" appears
- [ ] "⠋ Admitting credential via IPEX" appears
- [ ] "✔ Credential admitted via IPEX" appears
- [ ] "✓ QVI:" appears with prefix
- [ ] No errors in Step 2

### Step 3+: Organizations
For each organization in config.json:

- [ ] "📋 Step N: Creating Organization: [ORG_NAME]" appears
- [ ] "✔ Created AID: [ORG_ALIAS]" appears
- [ ] Legal Entity credential issued successfully
- [ ] All persons created successfully
- [ ] All agents created successfully
- [ ] No errors for organization

### Final Summary
- [ ] "✅ Setup Complete!" appears
- [ ] Trust chain summary displayed
- [ ] All organizations listed
- [ ] All persons listed
- [ ] All agents listed
- [ ] "💾 All data saved to ./data/" appears

## Post-Setup Verification

### Data Files
- [ ] `data/identities.json` exists
- [ ] `data/credentials.json` exists
- [ ] `data/identities.json` contains all created AIDs
- [ ] `data/credentials.json` contains all issued credentials

### Identity Verification
```bash
cat data/identities.json | jq '.[] | {alias: .alias, type: .type, prefix: .prefix}'
```
- [ ] GLEIF_ROOT identity exists
- [ ] QVI identity exists
- [ ] All Legal Entity identities exist
- [ ] All Person identities exist
- [ ] All Agent identities exist

### Credential Verification
```bash
cat data/credentials.json | jq '.[] | {type: .type, issuer: .issuer, issuee: .issuee, status: .status}'
```
- [ ] QVI credential exists (issued by ROOT)
- [ ] Legal Entity credentials exist (issued by QVI)
- [ ] Person credentials exist (issued by LE)
- [ ] Agent credentials exist (issued by Person)
- [ ] All credentials have status "issued"

### KERIA Verification
Check KERIA for stored identities:
```bash
# List all identifiers (this requires KERIA CLI or API call)
```
- [ ] All AIDs visible in KERIA
- [ ] All credentials accessible
- [ ] All registries created

## Troubleshooting Verification

### If Schema Resolution Fails
- [ ] Checked vlei-server logs
- [ ] Verified schema OOBI URLs are accessible
- [ ] Confirmed schema SAIDs match in config
- [ ] Restarted vlei-server if needed

### If Credential Issuance Fails
- [ ] Verified Step 0 completed successfully
- [ ] Checked KERIA logs
- [ ] Confirmed registries were created
- [ ] Verified OOBI resolutions succeeded

### If IPEX Grant/Admit Fails
- [ ] Checked notification polling
- [ ] Verified both parties resolved each other's OOBIs
- [ ] Confirmed timestamps are valid
- [ ] Checked for timing issues

## Success Metrics

### Quantitative
- [ ] 0 errors during setup
- [ ] All expected identities created (count from config.json)
- [ ] All expected credentials issued (count from config.json)
- [ ] Setup completed in reasonable time (< 5 minutes)

### Qualitative
- [ ] No schema resolution errors
- [ ] No "credential not found" errors
- [ ] Clean output with all ✓ checkmarks
- [ ] Data files are properly formatted
- [ ] All trust relationships established

## Documentation Verification

- [ ] README_FIXED.md reviewed
- [ ] VLEI_SETUP_INSTRUCTIONS.md reviewed
- [ ] VLEI_SCHEMA_RESOLUTION_SUMMARY.md reviewed
- [ ] SCHEMA_RESOLUTION_FLOW.md reviewed
- [ ] All example commands tested

## Final Sign-Off

Date: _______________
Setup Successful: [ ] Yes [ ] No
Issues Encountered: _________________________________
Resolution Time: _________________________________
Notes: _________________________________

---

**If all items are checked, congratulations! Your vLEI setup is complete! 🎉**

**If some items failed, refer to:**
- VLEI_SETUP_INSTRUCTIONS.md for troubleshooting
- VLEI_SCHEMA_RESOLUTION_SUMMARY.md for technical details
- Error logs in the console output
