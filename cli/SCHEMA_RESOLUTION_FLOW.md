# vLEI Schema Resolution Flow

## Before Fix (Failed) ❌

```
npm run setup:vlei
    ↓
Initialize KERIA
    ↓
Create GLEIF ROOT
    ↓
Create QVI
    ↓
Issue QVI Credential
    ↓
❌ ERROR: Credential schema EBfdlu8R27... not found
    Schema must be loaded with data oobi first!
```

## After Fix (Success) ✅

```
npm run setup:vlei
    ↓
Initialize KERIA
    ↓
╔═══════════════════════════════════════╗
║  NEW STEP 0: Resolve Schema OOBIs    ║
╠═══════════════════════════════════════╣
║  ↓ Legal Entity vLEI Schema          ║
║  ↓ QVI vLEI Schema                   ║
║  ↓ Official Org Role vLEI Schema     ║
╚═══════════════════════════════════════╝
    ↓ ✓ All schemas now available in KERIA
    ↓
Create GLEIF ROOT
    ↓
Create QVI
    ↓
Issue QVI Credential
    ↓
✅ SUCCESS: Credential issued!
    ↓
Create Organizations
    ↓
Issue Legal Entity Credentials
    ↓
✅ SUCCESS: All credentials issued!
```

## Schema OOBI Resolution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    vlei-server:7723                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Legal Entity vLEI Schema                            │  │
│  │  SAID: EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvE...   │  │
│  │  OOBI: /oobi/EBfdlu8R27...                           │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  QVI vLEI Schema                                     │  │
│  │  SAID: EGK32f9DY8VH5k8lCiLZ3l6EQ2KHwMHQO2xqZ...    │  │
│  │  OOBI: /oobi/EGK32f9DY8VH...                         │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Official Org Role vLEI Schema                       │  │
│  │  SAID: ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ6...    │  │
│  │  OOBI: /oobi/ENPXp1vQzRF6...                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↑
                           │ HTTP GET
                           │
┌──────────────────────────┴──────────────────────────────────┐
│              vLEI Setup (Step 0)                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  KERIAService.resolveSchemaOOBI()                     │ │
│  │    ↓                                                   │ │
│  │  client.oobis().resolve(schemaOobiUrl, schemaName)    │ │
│  │    ↓                                                   │ │
│  │  Wait for operation completion                        │ │
│  │    ↓                                                   │ │
│  │  ✓ Schema now available in KERIA                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  KERIA (KERI Agent)                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Schema Registry (Now Populated)                      │ │
│  │  • Legal Entity vLEI Schema ✓                         │ │
│  │  • QVI vLEI Schema ✓                                  │ │
│  │  • Official Org Role vLEI Schema ✓                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Credential Issuance (Steps 1, 2, 3+)            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  KERIAService.issueCredential()                       │ │
│  │    ↓                                                   │ │
│  │  client.credentials().issue({                         │ │
│  │    s: schemaSaid,  ← Schema found in registry! ✓      │ │
│  │    ...                                                 │ │
│  │  })                                                    │ │
│  │    ↓                                                   │ │
│  │  ✅ Credential issued successfully!                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Code Flow Comparison

### Before (Failed)

```typescript
async execute() {
    await KERIAService.initialize();
    
    // Step 1: Create ROOT
    const rootClient = await KERIAService.createClient(...);
    // ...
    
    // Step 2: Issue QVI Credential
    await KERIAService.issueCredential(
        rootClient, 
        'GLEIF_ROOT', 
        registry, 
        'EBfdlu8R27...',  // ❌ Schema not found!
        qviPrefix,
        attributes
    );
}
```

### After (Success)

```typescript
async execute() {
    await KERIAService.initialize();
    
    // ✨ NEW STEP 0: Resolve Schemas
    const tempClient = await KERIAService.createClient(...);
    await KERIAService.resolveSchemaOOBI(
        tempClient, 
        'http://127.0.0.1:7723/oobi/EBfdlu8R27...',
        'Legal Entity vLEI Credential'
    );
    // ... resolve other schemas
    
    // Step 1: Create ROOT
    const rootClient = await KERIAService.createClient(...);
    // ...
    
    // Step 2: Issue QVI Credential
    await KERIAService.issueCredential(
        rootClient, 
        'GLEIF_ROOT', 
        registry, 
        'EBfdlu8R27...',  // ✅ Schema found!
        qviPrefix,
        attributes
    );
}
```

## Key Changes

| File | Change | Impact |
|------|--------|--------|
| `keria.service.ts` | Added `resolveSchemaOOBI()` | Enables schema resolution |
| `vlei-schemas.config.ts` | New schema config | Centralizes schema URLs/SAIDs |
| `setup-vlei.command.ts` | Added Step 0 | Resolves schemas before use |

## Resolution Order

```
1. Start vlei-server:7723
2. Verify server is running
3. Run setup
4. Step 0: Resolve schemas
5. Schemas cached in KERIA
6. Issue credentials (now works!)
```
