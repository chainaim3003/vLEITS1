# KERI/ACDC Credential Issuance Flow (Based on Official Training)

## Overview
This document explains the correct IPEX credential issuance flow based on the official GLEIF vLEI training materials.

## Source Reference
- **Training Repository**: `vlei-trainings/jupyter/notebooks/`
- **Specific Notebook**: `102_20_KERIA_Signify_Credential_Issuance.ipynb`

## Complete Credential Issuance Flow

### Prerequisites (Already Completed in Your Setup)
1. ✅ Initialize Signify-TS library
2. ✅ Create clients for Issuer and Holder
3. ✅ Create AIDs for both parties
4. ✅ Assign agent roles
5. ✅ Generate and resolve OOBIs (establish connections)
6. ✅ Resolve schema OOBIs

### Step 1: Create Credential Registry (Issuer)
```typescript
const createRegistryResult = await issuerClient
    .registries()
    .create({ name: issuerAidAlias, registryName: issuerRegistryName });

const createRegistryOperation = await createRegistryResult.op();

const createRegistryResponse = await issuerClient
    .operations()
    .wait(createRegistryOperation, AbortSignal.timeout(DEFAULT_TIMEOUT_MS));

await issuerClient.operations().delete(createRegistryOperation.name);

// Get the registry SAID
const issuerRegistries = await issuerClient.registries().list(issuerAidAlias);
const issuerRegistry = issuerRegistries[0];
```

### Step 2: Retrieve Schema Definition (Issuer)
```typescript
const issuerSchema = await issuerClient.schemas().get(schemaSaid);
```

### Step 3: Issue the ACDC (Issuer)
```typescript
const credentialClaims = {
    "eventName": "GLEIF Summit",
    "accessLevel": "staff",
    "validDate": "2026-10-01"
};

const issueResult = await issuerClient
    .credentials()
    .issue(issuerAidAlias, {
        ri: issuerRegistry.regk,  // Registry Identifier
        s: schemaSaid,            // Schema identifier
        a: {                      // Attributes block
            i: holderAid.i,       // Issuee (credential subject)
            ...credentialClaims   // The actual claims data
        }
    });

// Wait for operation to complete
const issueOperation = await issueResult.op;  // Note: .op not .op()
const issueResponse = await issuerClient
    .operations()
    .wait(issueOperation, AbortSignal.timeout(DEFAULT_TIMEOUT_MS));

await issuerClient.operations().delete(issueOperation.name);

// Extract the credential SAID
const credentialSaid = issueResponse.response.ced.d;
```

### Step 4: **CRITICAL** - Retrieve Full Credential (Issuer)
```typescript
// 🚨 THIS IS THE CRITICAL STEP THAT WAS MISSING! 🚨
// The operation response doesn't contain all IPEX-required fields
// You MUST retrieve the credential from the client's local store

const issuerCredential = await issuerClient.credentials().get(credentialSaid);

// issuerCredential now contains:
// - sad: The ACDC (credential) itself
// - iss: The issuance event from the registry (TEL)
// - anc: The KEL event anchoring the TEL
// - ancatc: Signatures for the anchoring event
```

### Step 5: Grant Credential via IPEX (Issuer)
```typescript
const [grant, gsigs, gend] = await issuerClient.ipex().grant({
    senderName: issuerAidAlias,
    acdc: new Serder(issuerCredential.sad),      // ✅ From retrieved credential
    iss: new Serder(issuerCredential.iss),       // ✅ From retrieved credential
    anc: new Serder(issuerCredential.anc),       // ✅ From retrieved credential
    ancAttachment: issuerCredential.ancatc,       // ✅ From retrieved credential
    recipient: holderAid.i,
    datetime: createTimestamp(),
});

const submitGrantOperation = await issuerClient
    .ipex()
    .submitGrant(issuerAidAlias, grant, gsigs, gend, [holderAid.i]);

const submitGrantResponse = await issuerClient
    .operations()
    .wait(submitGrantOperation, AbortSignal.timeout(DEFAULT_TIMEOUT_MS));

await issuerClient.operations().delete(submitGrantOperation.name);
```

### Step 6: Receive Grant Notification (Holder)
```typescript
// Retry loop to wait for notification
let notifications;
for (let attempt = 1; attempt <= DEFAULT_RETRIES; attempt++) {
    let allNotifications = await holderClient.notifications().list();
    notifications = allNotifications.notes.filter(
        (n) => n.a.r === IPEX_GRANT_ROUTE && n.r === false
    );
    if (notifications.length > 0) break;
    await sleep(DEFAULT_DELAY_MS);
}

const grantNotification = notifications[0];

// Retrieve the grant exchange details
const grantExchange = await holderClient.exchanges().get(grantNotification.a.d);
```

### Step 7: Admit Credential (Holder)
```typescript
const [admit, sigs, aend] = await holderClient.ipex().admit({
    senderName: holderAidAlias,
    message: '',
    grantSaid: grantNotification.a.d,
    recipient: issuerAid.i,
    datetime: createTimestamp(),
});

const admitOperation = await holderClient
    .ipex()
    .submitAdmit(holderAidAlias, admit, sigs, aend, [issuerAid.i]);

await holderClient
    .operations()
    .wait(admitOperation, AbortSignal.timeout(DEFAULT_TIMEOUT_MS));

await holderClient.operations().delete(admitOperation.name);

// Mark notification as read
await holderClient.notifications().mark(grantNotification.i);

// Retrieve the admitted credential
const holderReceivedCredential = await holderClient.credentials().get(credentialSaid);
```

### Step 8: Receive Admit Notification (Issuer)
```typescript
// Wait for admit notification
let issuerAdmitNotifications;
for (let attempt = 1; attempt <= DEFAULT_RETRIES; attempt++) {
    let allNotifications = await issuerClient.notifications().list();
    issuerAdmitNotifications = allNotifications.notes.filter(
        (n) => n.a.r === IPEX_ADMIT_ROUTE && n.r === false
    );
    if (issuerAdmitNotifications.length > 0) break;
    await sleep(DEFAULT_DELAY_MS);
}

const admitNotificationForIssuer = issuerAdmitNotifications[0];

// Mark as read
await issuerClient.notifications().mark(admitNotificationForIssuer.i);
```

## Key Lessons

### ❌ WRONG WAY (Your Original Code)
```typescript
// Issue credential
const { said, credential } = await issueCredential(...);

// Try to grant using operation response directly
await grantCredential(client, alias, holderPrefix, credential);
// ❌ FAILS: credential from operation doesn't have sad/iss/anc/ancatc
```

### ✅ CORRECT WAY (Fixed Code)
```typescript
// Issue credential
const { said, credential } = await issueCredential(...);
// Inside issueCredential:
//   1. Issue operation
//   2. Wait for completion
//   3. Get SAID from response
//   4. await sleep(1000)  // Let KERIA store it
//   5. const cred = await client.credentials().get(said)  // 🔑 KEY STEP
//   6. return { said, credential: cred }

// Grant using the retrieved credential (has all fields)
await grantCredential(client, alias, holderPrefix, credential);
// ✅ SUCCESS: credential has sad, iss, anc, ancatc
```

## Why This Pattern?

1. **Operation Response is Partial**: The operation response contains metadata but not the complete credential structure needed for IPEX
2. **Client Store is Complete**: `client.credentials().get()` returns the full credential with all required fields
3. **Async Storage**: KERIA needs time to process and store the credential, hence the sleep
4. **IPEX Requirements**: IPEX grant needs:
   - `sad`: The credential data
   - `iss`: Registry issuance event (proves it's in the TEL)
   - `anc`: KEL anchor event (proves it's anchored to KEL)
   - `ancatc`: Signatures for the anchor (proves authenticity)

## Testing Your Fix

After applying the changes:

```bash
cd C:\SATHYA\CHAINAIM3003\mcp-servers\stellarboston\vLEI1\vLEITS1\cli
npm run build
npm run setup:vlei
```

Expected output:
```
✓ Credential issued: [SAID]
[DEBUG] Credential structure from client store:
[DEBUG]   - has sad: true
[DEBUG]   - has iss: true
[DEBUG]   - has anc: true
[DEBUG]   - has ancatc: true
✓ Credential granted via IPEX
```

## Additional Resources

- **Official Training**: Check all notebooks in `vlei-trainings/jupyter/notebooks/`
- **Credential Presentation**: See `102_25_KERIA_Signify_Credential_Presentation_and_Revocation.ipynb`
- **vLEI Trust Chain**: See `103_10_vLEI_Trust_Chain.ipynb`
