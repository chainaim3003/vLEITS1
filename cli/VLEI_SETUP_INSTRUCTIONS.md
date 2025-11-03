# vLEI Setup Instructions

## Prerequisites

Before running the vLEI setup, you need to ensure the vLEI schema server is running.

### Starting the vLEI Schema Server

The vLEI schema server must be running on port 7723 to provide the credential schemas.

#### Option 1: Using Docker (Recommended)
```bash
docker run -d -p 7723:7723 --name vlei-server weboftrust/vlei-server:latest
```

#### Option 2: From Source
```bash
cd /path/to/vlei-server
python -m vLEI_server.server --port 7723
```

### Verify Schema Server is Running
```bash
curl http://127.0.0.1:7723/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao
```

You should see a JSON response with the Legal Entity vLEI Credential schema.

## Running the Setup

Once the schema server is running:

```bash
npm run setup:vlei
```

## What Happens During Setup

1. **Step 0**: Resolves vLEI Schema OOBIs
   - Legal Entity vLEI Credential Schema
   - QVI vLEI Credential Schema  
   - Official Organization Role vLEI Credential Schema

2. **Step 1**: Creates GLEIF ROOT
   - Creates root AID
   - Sets up registry for credential issuance

3. **Step 2**: Creates QVI (Qualified vLEI Issuer)
   - Creates QVI AID
   - Receives QVI credential from ROOT
   - Establishes trust relationship with ROOT

4. **Step 3+**: Creates Organizations
   - Creates Legal Entity AIDs
   - Issues Legal Entity vLEI credentials
   - Creates Persons and their Official Role credentials
   - Creates Agents with Engagement Context Role credentials

## Troubleshooting

### Schema Not Found Error
```
Credential schema EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao not found
```

**Solution**: Make sure the vlei-server is running on port 7723

### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:7723
```

**Solution**: Start the vlei-server before running setup

### Schema OOBI Resolution Failed
Check if the schema SAIDs in `src/config/vlei-schemas.config.ts` match those served by your vlei-server.
