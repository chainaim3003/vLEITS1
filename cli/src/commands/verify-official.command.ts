import { RealCredentialVerifier } from '../services/credential-verifier.service';
import { CredentialDataLoader } from '../utils/credential-loader';
import { ConsoleUtils } from '../utils/console.utils';

export async function verifyOfficialCommand() {
    console.log('🧪 Testing Real vLEI Official Credentials\n');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const verifier = new RealCredentialVerifier('./data');
    const loader = new CredentialDataLoader('./data');
    
    try {
        // Load all identities and credentials (no KERIA initialization needed)
        ConsoleUtils.startSpinner('Loading credentials from data files');
        const identities = await loader.loadIdentities();
        const credentials = await loader.loadCredentials();
        ConsoleUtils.succeedSpinner(`Loaded ${identities.size} identities and ${credentials.size} credentials`);
        console.log();
        
        // Get all agents
        const agents = await loader.getAllAgents();
        
        if (agents.length === 0) {
            console.error('❌ No agent identities found in data');
            console.error('   Please run: npm run setup:vlei-official first\n');
            return;
        }
        
        console.log(`📋 Found ${agents.length} agent(s) to verify\n`);
        
        // Test each agent
        for (const agent of agents) {
            await testAgent(verifier, loader, agent.alias);
        }
        
        console.log('\n🎉 All verification tests completed!\n');
        console.log('═══════════════════════════════════════════════════════\n');
        
    } catch (error: any) {
        console.error('\n❌ Verification failed:', error.message);
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        process.exit(1);
    }
}

async function testAgent(
    verifier: RealCredentialVerifier,
    loader: CredentialDataLoader,
    agentAlias: string
) {
    console.log('─'.repeat(70));
    console.log(`🔍 Testing Agent: ${agentAlias}`);
    console.log('─'.repeat(70));
    console.log();
    
    // Test 1: Verify complete chain
    console.log('Test 1: Complete Chain Verification');
    console.log('────────────────────────────────────');
    
    try {
        const chainResult = await verifier.verifyAgentChain(agentAlias);
        
        if (chainResult.valid) {
            console.log('✅ Chain is VALID\n');
        } else {
            console.log('❌ Chain is INVALID\n');
        }
        
        chainResult.chain.forEach((step, index) => {
            const icon = step.valid ? '✓' : '✗';
            const truncatedSAID = step.said.substring(0, 30) + '...';
            console.log(`  ${index + 1}. ${icon} ${step.type.padEnd(10)} ${truncatedSAID}`);
            if (step.reason) {
                console.log(`     Reason: ${step.reason}`);
            }
        });
        console.log();
    } catch (error: any) {
        console.log(`❌ Chain verification failed: ${error.message}\n`);
    }
    
    // Test 2: Verify each credential individually
    console.log('Test 2: Individual Credential Verification');
    console.log('──────────────────────────────────────────');
    
    try {
        const chain = await loader.getCredentialChain(agentAlias);
        
        for (const cred of chain) {
            const result = await verifier.verifyCredentialFromData(cred.said);
            const icon = result.valid ? '✅' : '❌';
            console.log(`${icon} ${cred.type}`);
            console.log(`   SAID:   ${cred.said}`);
            console.log(`   Issuer: ${cred.issuer.substring(0, 40)}...`);
            console.log(`   Issuee: ${cred.issuee.substring(0, 40)}...`);
            console.log(`   Status: ${cred.status}`);
            if (result.reason) {
                console.log(`   ❌ Reason: ${result.reason}`);
            }
            console.log();
        }
    } catch (error: any) {
        console.log(`❌ Individual verification failed: ${error.message}\n`);
    }
    
    // Test 3: Verify chain edges
    console.log('Test 3: Chain Edge Verification');
    console.log('────────────────────────────────');
    
    try {
        const edgeResult = await verifier.verifyChainEdges(agentAlias);
        
        if (edgeResult.valid) {
            console.log('✅ All edges are VALID\n');
        } else {
            console.log('❌ Some edges are INVALID\n');
        }
        
        edgeResult.edges.forEach((edge, index) => {
            const icon = edge.valid ? '✓' : '✗';
            const arrow = `--[${edge.edgeName}]-->`;
            console.log(`  ${index + 1}. ${icon} ${edge.from.padEnd(10)} ${arrow} ${edge.to}`);
            if (edge.reason) {
                console.log(`     ❌ Reason: ${edge.reason}`);
            }
        });
        console.log();
    } catch (error: any) {
        console.log(`❌ Edge verification failed: ${error.message}\n`);
    }
    
    // Test 4: Verify issuer KELs
    console.log('Test 4: Issuer KEL Verification');
    console.log('────────────────────────────────');
    
    try {
        const chain = await loader.getCredentialChain(agentAlias);
        
        for (const cred of chain) {
            const result = await verifier.verifyIssuerKEL(cred.said);
            const icon = result.valid ? '✓' : '✗';
            const issuerDisplay = result.issuer ? result.issuer.substring(0, 40) + '...' : 'unknown';
            console.log(`  ${icon} ${cred.type.padEnd(10)} issued by ${issuerDisplay}`);
            if (result.kelLength) {
                console.log(`     KEL length: ${result.kelLength} events`);
            }
            if (result.reason) {
                console.log(`     ❌ Reason: ${result.reason}`);
            }
        }
        console.log();
    } catch (error: any) {
        console.log(`❌ KEL verification failed: ${error.message}\n`);
    }
}
