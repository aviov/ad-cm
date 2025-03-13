import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 4000;

// Basic middleware
app.use(express.json());

// Route to handle ALB path pattern
app.get('/integration/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'integration-api' });
});

app.get('/integration', (req: Request, res: Response) => {
  res.status(200).json({ 
    message: 'Integration API - Minimal implementation',
    version: '1.0.0' 
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'integration-api' });
});

// Default route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ 
    message: 'Integration API - Minimal implementation',
    version: '1.0.0' 
  });
});

// Start server
app.listen(port, () => {
  console.log(`Integration API listening on port ${port}`);
});

export default app; // Export for testing