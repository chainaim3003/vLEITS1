#!/usr/bin/env node

/**
 * Local vLEI Schema Server
 * Serves vLEI credential schemas on localhost:7723
 * This is a workaround since we can't access GLEIF's testnet schema server
 */

const http = require('http');
const url = require('url');

// vLEI Schema SAIDs and their minimal schema definitions
const SCHEMAS = {
    // QVI vLEI Credential
    'EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao': {
        "$id": "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Qualified vLEI Issuer vLEI Credential",
        "description": "A vLEI Credential issued by GLEIF to Qualified vLEI Issuers",
        "type": "object",
        "credentialType": "QualifiedvLEIIssuervLEICredential",
        "version": "1.0.0"
    },
    
    // Legal Entity vLEI Credential
    'ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY': {
        "$id": "ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Legal Entity vLEI Credential",
        "description": "A vLEI Credential issued by a Qualified vLEI issuer to a Legal Entity",
        "type": "object",
        "credentialType": "LegalEntityvLEICredential",
        "version": "1.0.0"
    },
    
    // Official Organization Role vLEI Credential
    'EH6ekLjSr8V32WyFbGe1zXjTzFs9PkTYmupJ9H65O14g': {
        "$id": "EH6ekLjSr8V32WyFbGe1zXjTzFs9PkTYmupJ9H65O14g",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Legal Entity Official Organizational Role vLEI Credential",
        "description": "A vLEI Role Credential issued by a Legal Entity to a Person",
        "type": "object",
        "credentialType": "LegalEntityOfficialOrganizationalRolevLEICredential",
        "version": "1.0.0"
    },
    
    // Engagement Context Role vLEI Credential
    'EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw': {
        "$id": "EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Legal Entity Engagement Context Role vLEI Credential",
        "description": "A vLEI Role Credential issued by a Legal Entity or Person to a Person",
        "type": "object",
        "credentialType": "LegalEntityEngagementContextRolevLEICredential",
        "version": "1.0.0"
    }
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    console.log(`${new Date().toISOString()} - ${req.method} ${pathname}`);

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Handle OOBI requests: /oobi/{SCHEMA_SAID}
    if (pathname.startsWith('/oobi/')) {
        const schemaId = pathname.split('/oobi/')[1];
        
        if (SCHEMAS[schemaId]) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(SCHEMAS[schemaId], null, 2));
            console.log(`  ✓ Served schema: ${SCHEMAS[schemaId].title}`);
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Schema not found', schemaId }));
            console.log(`  ✗ Schema not found: ${schemaId}`);
        }
        return;
    }

    // Root endpoint - list available schemas
    if (pathname === '/' || pathname === '') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const schemaList = Object.keys(SCHEMAS).map(id => ({
            id,
            title: SCHEMAS[id].title,
            oobi: `http://localhost:7723/oobi/${id}`
        }));
        res.end(JSON.stringify({
            message: 'Local vLEI Schema Server',
            schemas: schemaList
        }, null, 2));
        return;
    }

    // 404 for other paths
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 7723;
server.listen(PORT, '127.0.0.1', () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  📋 Local vLEI Schema Server');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  Listening on: http://127.0.0.1:${PORT}`);
    console.log('');
    console.log('  Available schemas:');
    Object.keys(SCHEMAS).forEach(id => {
        console.log(`  • ${SCHEMAS[id].title}`);
        console.log(`    http://127.0.0.1:${PORT}/oobi/${id}`);
    });
    console.log('');
    console.log('  Press Ctrl+C to stop');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Error: Port ${PORT} is already in use.`);
        console.error('   Please stop the other process or use a different port.\n');
    } else {
        console.error('\n❌ Server error:', err.message, '\n');
    }
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down schema server...\n');
    server.close(() => {
        console.log('✓ Server stopped\n');
        process.exit(0);
    });
});
