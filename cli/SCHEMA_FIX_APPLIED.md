# Schema Resolution Fix Applied

## What Was Fixed

Added schema OOBI resolution at the correct points in the Jupiter setup flow:

### 1. ROOT Client Resolution (Before issuing QVI credential)
- Resolves QVI schema OOBI

### 2. QVI Client Resolution (Before issuing LE credential)
- Resolves Legal Entity schema OOBI
- Resolves OOR schema OOBI  
- Resolves ECR schema OOBI

### 3. LE Client Resolution (Before issuing OOR credential)
- Resolves OOR schema OOBI
- Resolves ECR schema OOBI

### 4. Person Client Resolution (Before issuing ECR credential)
- Resolves ECR schema OOBI

## Why This Works

Each client must resolve the schema OOBI **before** it tries to issue a credential using that schema. The schemas are hosted on vlei-server (Docker internal network at http://vlei-server:7723).

## Next Steps

1. Rebuild: `npm run build`
2. Run: `npm run setup:jupiter`

The setup should now complete successfully through all 5 steps!
