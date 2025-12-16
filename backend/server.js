import { startServer } from './utils/serverConfig.js';
import { setupErrorHandlers } from './utils/errorHandler.js';

// Setup error handlers first
setupErrorHandlers();

// Start the server
startServer();
