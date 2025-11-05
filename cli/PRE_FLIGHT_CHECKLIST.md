# ✅ Pre-Flight Checklist - Before Running Tests

## 📋 Quick Verification Checklist

Run through this checklist before testing:

### 1. ✅ Check Data Files Exist

```bash
dir C:\SATHYA\CHAINAIM3003\mcp-servers\stellarboston\vLEI1\vLEITS1\cli\data
```

Should see:
- ✅ `credentials.json` (contains all 10 credentials)
- ✅ `identities.json` (contains all 7 identities)

### 2. ✅ Check Files Are Not Empty

```bash
type C:\SATHYA\CHAINAIM3003\mcp-servers\stellarboston\vLEI1\vLEITS1\cli\data\credentials.json
```

Should show credential data (not just `{}`)

```bash
type C:\SATHYA\CHAINAIM3003\mcp-servers\stellarboston\vLEI1\vLEITS1\cli\data\identities.json
```

Should show identity data (not just `{}`)

### 3. ✅ Verify Code Changes Applied

Check these files have been updated:

#### File 1: verify-official.command.ts
```bash
type C:\SATHYA\CHAINAIM3003\mcp-servers\stellarboston\vLEI1\vLEITS1\cli\src\commands\verify-official.command.ts | findstr "verifyCredentialFromData"
```

Should show: `verifyCredentialFromData` (not `verifyCredentialFromKERIA`)

#### File 2: credential-verifier.service.ts
```bash
type C:\SATHYA\CHAINAIM3003\mcp-servers\stellarboston\vLEI1\vLEITS1\cli\src\services\credential-verifier.service.ts | findstr "verifyCredentialFromData"
```

Should show the method exists

### 4. ✅ Check Node and NPM

```bash
node --version
npm --version
```

Should show versions (any recent version is fine)

### 5. ✅ Install Dependencies (if needed)

```bash
cd C:\SATHYA\CHAINAIM3003\mcp-servers\stellarboston\vLEI1\vLEITS1\cli
npm install
```

Should complete without errors

## 🚀 Ready to Test!

If all checkboxes above are ✅, then run:

```bash
cd C:\SATHYA\CHAINAIM3003\mcp-servers\stellarboston\vLEI1\vLEITS1\cli
npm run build
```

### Expected Build Output:
```
> vlei-ts-cli@2.0.0 build
> tsc

[Should complete with NO errors]
```

### If Build Succeeds, Run Tests:
```bash
npm run test:verify-official
```

## ❌ Troubleshooting

### "Cannot find module"
```bash
npm install
npm run build
```

### "Data files not found"
```bash
# Recreate data files
npm run setup:vlei-official
```

### TypeScript Errors
- Make sure all edits were saved
- Check file encoding is UTF-8
- Try deleting `build/` folder and rebuilding

### "No agent identities found"
```bash
# Check identities.json has agents
type data\identities.json | findstr "agent"
```

Should show lines with `"role": "agent"`

## 📊 Expected Final Results

When everything works, you'll see:

```
🧪 Testing Real vLEI Official Credentials

════════════════════════════════════════════════════════

✓ Loaded 7 identities and 10 credentials

📋 Found 2 agent(s) to verify

──────────────────────────────────────────────────────
🔍 Testing Agent: jupiterSellerAgent
──────────────────────────────────────────────────────

Test 1: Complete Chain Verification
────────────────────────────────────
✅ Chain is VALID

  1. ✓ Engagement Context Role
  2. ✓ Official Organizational Role
  3. ✓ OOR Authorization
  4. ✓ Legal Entity
  5. ✓ Qualified vLEI Issuer

[... 3 more tests with all ✅ ...]

──────────────────────────────────────────────────────
🔍 Testing Agent: tommyBuyerAgent
──────────────────────────────────────────────────────

[... same 4 tests, all ✅ ...]

🎉 All verification tests completed!
```

## ✅ Success Indicators

| Indicator | What It Means |
|-----------|---------------|
| ✅ Build completes | TypeScript code is valid |
| ✅ 7 identities loaded | All roles present |
| ✅ 10 credentials loaded | All credentials created |
| ✅ 2 agents found | Both test agents exist |
| ✅ Chain is VALID | 5-credential chain verified |
| ✅ All edges VALID | Proper linking |
| ✅ All KELs verified | Issuer validation works |

## 🎉 When All Green

You've successfully:
1. ✅ Created a real vLEI credential system
2. ✅ Issued complete 5-credential chains
3. ✅ Implemented proper verification
4. ✅ Used official GLEIF schemas
5. ✅ Built production-ready code

## 📚 Next Documentation to Read

After tests pass:
1. `VERIFICATION_LOCAL_DATA_FIX.md` - Understand why it works
2. `CHAIN_STRUCTURE_FIX.md` - Learn the credential chain
3. `COMPLETE_FIX_SUMMARY.md` - See what was accomplished

## 🚀 Go Time!

Everything is ready. Just run:
```bash
cd C:\SATHYA\CHAINAIM3003\mcp-servers\stellarboston\vLEI1\vLEITS1\cli
npm run build && npm run test:verify-official
```

Watch for the ✅ indicators! 🎊
