import { Router } from 'express';
import { VerifyController } from '../controllers/verify.controller';

const router = Router();

// POST /api/v1/verify/credential
router.post('/credential', VerifyController.verifyCredential);

// POST /api/v1/verify/agent/chain
router.post('/agent/chain', VerifyController.verifyAgentChain);

// POST /api/v1/verify/agent/edges
router.post('/agent/edges', VerifyController.verifyChainEdges);

// POST /api/v1/verify/trading-partner
router.post('/trading-partner', VerifyController.verifyTradingPartner);

export default router;
