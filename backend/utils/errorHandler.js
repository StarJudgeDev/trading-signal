import { logger } from './logger.js';
import { stopPriceFetcher } from '../services/priceFetcher.js';

/**
 * Setup error handlers for the application
 */
export function setupErrorHandlers() {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
      reason: reason?.message || reason,
      promise: promise
    });
  });

  // Graceful shutdown handlers
  const gracefulShutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    stopPriceFetcher();
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}
