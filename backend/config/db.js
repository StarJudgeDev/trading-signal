import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export const connect = (url) => {
  // Log connection attempt
  logger.db('Attempting to connect to MongoDB', { 
    url: url.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') // Hide credentials
  });
  
  // Set up mongoose event listeners for detailed logging
  mongoose.connection.on('connecting', () => {
    logger.db('MongoDB connecting...');
  });
  
  mongoose.connection.on('connected', () => {
    logger.db('MongoDB connected successfully', {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      database: mongoose.connection.name,
      readyState: mongoose.connection.readyState
    });
  });
  
  mongoose.connection.on('open', () => {
    logger.db('MongoDB connection opened');
  });
  
  mongoose.connection.on('disconnecting', () => {
    logger.db('MongoDB disconnecting...');
  });
  
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
  
  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });
  
  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error', { error: error.message, stack: error.stack });
  });
  
  // Log all database operations in development
  if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', (collectionName, method, query, doc) => {
      logger.db(`MongoDB Query: ${collectionName}.${method}`, {
        query: JSON.stringify(query),
        doc: doc ? JSON.stringify(doc) : null
      });
    });
  }
  
  return mongoose.connect(url).then(res => {
    logger.info('✅ DB connected successfully');
    return res;
  }).catch(error => {
    logger.error('❌ DB connection failed', {
      error: error.message,
      name: error.name,
      code: error.code
    });
    throw error;
  });
};
