// Express wrapper for Vite dev server to ensure port detection
import express from 'express';
import { createServer as createViteServer } from 'vite';

const app = express();
const port = 5000;

// Health check endpoint for workflow detection
app.get('/_health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create Vite server in middleware mode
const vite = await createViteServer({
  server: { 
    middlewareMode: true,
    host: '0.0.0.0'
  },
  appType: 'spa'
});

// Use vite's connect instance as middleware
app.use(vite.ssrFixStacktrace);
app.use(vite.middlewares);

// Start Express server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Dev server running on http://0.0.0.0:${port}`);
  console.log(`📱 Network: http://172.31.84.226:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down dev server...');
  server.close(() => {
    vite.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down dev server...');
  server.close(() => {
    vite.close();
    process.exit(0);
  });
});