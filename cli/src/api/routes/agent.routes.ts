import { Router, Request, Response } from 'express';
import { CredentialDataLoader } from '../../utils/credential-loader';

const router = Router();

// GET /api/v1/agents
router.get('/agents', async (req: Request, res: Response) => {
    try {
        const loader: CredentialDataLoader = req.app.locals.loader;
        const agents = await loader.getAllAgents();
        const identities = await loader.loadIdentities();

        const agentDetails = agents.map(agent => {
            const identity = identities.get(agent.aid || agent.prefix);
            return {
                alias: agent.alias,
                aid: agent.aid || agent.prefix,
                role: agent.role,
                name: identity?.name || agent.alias || 'Unknown'
            };
        });

        res.json({
            success: true,
            count: agentDetails.length,
            agents: agentDetails,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// GET /api/v1/credential/:said
router.get('/credential/:said', async (req: Request, res: Response) => {
    try {
        const { said } = req.params;
        const loader: CredentialDataLoader = req.app.locals.loader;
        const credentials = await loader.loadCredentials();
        const credential = credentials.get(said);

        if (!credential) {
            return res.status(404).json({
                success: false,
                error: 'Credential not found',
                said
            });
        }

        res.json({
            success: true,
            credential,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

export default router;
