# Alternative vLEI Setup (Without External Schema Server)

## Issue
The Docker image `weboftrust/vlei-server` doesn't exist. We need to work with KERIA's built-in capabilities.

## Option 1: Try Without Schema Server (Simplest)

KERIA might have vLEI schemas pre-loaded or cached. Let's try:

```bash
cd /c/SATHYA/CHAINAIM3003/mcp-servers/stellarboston/vLEI1/vLEITS1/cli
npm run build
npm run setup:vlei
```

If this works, great! If you get "schema not found" errors, proceed to Option 2.

## Option 2: Check KERIA's Schema Support

Check if KERIA has built-in schema support:

```bash
# Check KERIA API for schemas endpoint
curl http://localhost:3901/schemas

# Or check KERIA documentation
```

## Option 3: Use Signify-TS Schema Loading

Some versions of Signify-TS can load schemas directly. Check the Signify-TS documentation for schema loading APIs.

## Option 4: Find the Real Schema Server

The vlei-server might be in a different repository or package. Let's search for it:

```bash
# Search GitHub for vlei-server
# Check WebOfTrust GitHub organization
# Look for schema-related repositories
```

## Option 5: Manual Schema Configuration in KERIA

If KERIA supports manual schema configuration:

1. Locate KERIA's configuration files
2. Add the vLEI schema definitions directly
3. Restart KERIA
4. Run setup again

## What to Try Now

### Step 1: Run the Setup
```bash
cd /c/SATHYA/CHAINAIM3003/mcp-servers/stellarboston/vLEI1/vLEITS1/cli
npm run setup:vlei
```

### Step 2: Check the Error
If you see:
```
❌ Credential schema EBfdlu8R27... not found
```

This tells us:
- KERIA doesn't have schemas pre-loaded
- We need to find the correct way to load schemas

### Step 3: Investigate KERIA

```bash
# Check if KERIA has a schema directory
ls /path/to/keria/schemas/

# Check KERIA logs for schema information
docker logs keria  # if running in Docker

# Check KERIA configuration
cat /path/to/keria/config.json
```

## Finding the Schema Server

The schema server is likely one of these:

1. **Part of KERIA itself** - Check KERIA docs for schema endpoints
2. **Separate WebOfTrust repo** - Search https://github.com/WebOfTrust
3. **vLEI-server Python package** - Check PyPI for vlei-server
4. **Part of signify-ts** - Check if schemas are bundled

## Quick Investigation Commands

```bash
# Check if vlei-server is a Python package
pip search vlei-server

# Check WebOfTrust GitHub
# Visit: https://github.com/orgs/WebOfTrust/repositories

# Check npm packages
npm search vlei-server
npm search schema-server

# Search your local files
find /c/SATHYA -name "*schema*" -type f 2>/dev/null | grep -i vlei
```

## Next Steps

1. Run `npm run setup:vlei` and share the exact error message
2. We'll determine if schemas are the issue or something else
3. If schemas are the issue, we'll find the correct way to load them

## Temporary Workaround

If all else fails, you might be able to create a mock schema server:

```javascript
// mock-schema-server.js
const http = require('http');

const schemas = {
  'EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao': { /* QVI schema */ },
  'ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY': { /* LE schema */ },
  // ...
};

const server = http.createServer((req, res) => {
  const schemaId = req.url.split('/').pop();
  if (schemas[schemaId]) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(schemas[schemaId]));
  } else {
    res.writeHead(404);
    res.end('Schema not found');
  }
});

server.listen(7723, () => console.log('Mock schema server on port 7723'));
```

Run: `node mock-schema-server.js`

---

**Let's proceed with trying the setup and seeing what specific error we get!**
