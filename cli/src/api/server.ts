import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'vLEI Verification API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /api/v1/health',
      agents: 'GET /api/v1/agents',
      verifyTradingPartner: 'POST /api/v1/verify/trading-partner',
    },
    documentation: {
      tradingPartner: {
        method: 'POST',
        url: '/api/v1/verify/trading-partner',
        body: {
          seller: {
            identifier: 'jupiterSellerAgent',
            identifierType: 'alias',
          },
          buyer: {
            identifier: 'tommyBuyerAgent',
            identifierType: 'alias',
          },
          transaction: {
            type: 'purchase_order',
            value: 50000,
            currency: 'USD',
          },
        },
      },
    },
  });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🚀 vLEI Verification API Server');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Running on: http://localhost:${PORT}`);
  console.log(`  Base URL:   http://localhost:${PORT}/api/v1`);
  console.log('');
  console.log('  Available endpoints:');
  console.log(`  • GET  /api/v1/health`);
  console.log(`  • GET  /api/v1/agents`);
  console.log(`  • POST /api/v1/verify/trading-partner`);
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
});

export default app;
