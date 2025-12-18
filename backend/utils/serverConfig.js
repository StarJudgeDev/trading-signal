import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { logger } from './logger.js';
import { connect } from '../config/db.js';
import router from '../routes/index.js';
import { startPriceFetcher } from '../services/priceFetcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

/**
 * Create and configure Express application
 */
export function createApp() {
  const app = express();

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    
    logger.info(`Incoming ${req.method} ${req.originalUrl || req.url}`, {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      contentType: req.get('content-type')
    });
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.request(req, res, duration);
    });
    
    next();
  });

  // Middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api', router);

  // Serve static files from frontend build
  app.use(express.static('../frontend/dist'));
  app.get('*', (_, res) => {
    res.sendFile('index.html', { root: path.join(__dirname, '../../frontend/dist') });
  });

  return app;
}

/**
 * Start the server
 */
export async function startServer() {
  const PORT = process.env.PORT || 3001;
  const app = createApp();

  try {
    logger.info('Starting server...', {
      port: PORT,
      nodeEnv: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
    
    // Connect to database
    await connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trading-signals');
    
    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
      });
      
      // Start price fetcher service
      startPriceFetcher();
    });
  } catch (error) {
    logger.error('❌ Server startup failed', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    process.exit(1);
  }
}
