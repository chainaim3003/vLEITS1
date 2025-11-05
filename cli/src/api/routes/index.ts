import { Router } from 'express';
import { VerificationController } from '../controllers/verification.controller';
import * as path from 'path';

const router = Router();
// Resolve data directory - go up to project root, then into data
// From build/api/routes -> ../../../data (build -> cli root -> data)
const dataDir = path.resolve(__dirname, '../../../data');
console.log('📁 Initializing VerificationController with dataDir:', dataDir);
const controller = new VerificationController(dataDir);

// POST /api/v1/verify/trading-partner
router.post('/verify/trading-partner', async (req, res) => {
  await controller.verifyTradingPartner(req, res);
});

// GET /api/v1/agents
router.get('/agents', async (req, res) => {
  await controller.getAgents(req, res);
});

// GET /api/v1/health
router.get('/health', async (req, res) => {
  await controller.healthCheck(req, res);
});

export default router;
