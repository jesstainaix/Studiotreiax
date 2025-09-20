/**
 * local server entry file, for local development
 */
import app from './app.js';
// import realTimeAnalyticsServer from './websocket/realTimeAnalytics.js';

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
  
  // Inicializar WebSocket para analytics em tempo real
  // realTimeAnalyticsServer.initialize(server);
  // console.log('Real-time Analytics WebSocket initialized');
});

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

