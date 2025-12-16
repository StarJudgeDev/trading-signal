import axios from 'axios';
import Signal from '../models/Signal.js';
import { logger } from '../utils/logger.js';

// MEXC Contract API base URL for fair price
const MEXC_CONTRACT_API_BASE = 'https://contract.mexc.com/api/v1';

/**
 * Fetch fair price for a trading pair from MEXC Contract API
 * @param {string} symbol - Trading pair symbol (e.g., 'BTC/USDT', 'ETH/USDT')
 * @returns {Promise<number|null>} - Fair price or null if error
 */
async function fetchPriceFromMEXC(symbol) {
  try {
    // Convert pair format (BTC/USDT) to MEXC contract format (BTC_USDT)
    const mexcSymbol = symbol.replace('/', '_').toUpperCase();
    
    const response = await axios.get(`${MEXC_CONTRACT_API_BASE}/contract/fair_price/${mexcSymbol}`, {
      timeout: 5000 // 5 second timeout
    });
    
    // MEXC Contract API response format: { success: true, code: 0, data: { symbol: "BTC_USDT", fairPrice: 87216.7, timestamp: ... } }
    if (response.data && response.data.success && response.data.data && response.data.data.fairPrice) {
      return parseFloat(response.data.data.fairPrice);
    }
    
    return null;
  } catch (error) {
    logger.error(`Failed to fetch fair price for ${symbol} from MEXC Contract API`, {
      symbol,
      mexcSymbol: symbol.replace('/', '_').toUpperCase(),
      error: error.message,
      response: error.response?.data
    });
    return null;
  }
}

/**
 * Update price for a single signal
 * Uses the same logic as the POST /:id/price route
 */
async function updateSignalPrice(signal) {
  try {
    logger.debug(`Fetching price for signal ${signal._id.toString().substring(0, 8)} - ${signal.pair}`, {
      signalId: signal._id,
      pair: signal.pair,
      symbol: signal.symbol,
      status: signal.status
    });
    
    const price = await fetchPriceFromMEXC(signal.pair);
    
    if (price === null) {
      logger.warn(`Skipping price update for signal ${signal._id} - price fetch failed`, {
        signalId: signal._id,
        pair: signal.pair,
        symbol: signal.symbol
      });
      return;
    }
    
    logger.debug(`Price fetched successfully for ${signal.pair}: ${price}`, {
      signalId: signal._id,
      pair: signal.pair,
      price
    });
    
    const priceTimestamp = new Date();
    
    // Add price to history
    signal.priceHistory = signal.priceHistory || [];
    signal.priceHistory.push({
      price: price,
      timestamp: priceTimestamp
    });
    
    // Update current price
    signal.currentPrice = price;
    
    // Check if price reached any targets (for LONG: price >= target, for SHORT: price <= target)
    let newTargetsReached = 0;
    const isLong = signal.type === 'LONG';
    
    for (let i = 0; i < signal.targets.length; i++) {
      const target = signal.targets[i];
      if (!target.reached) {
        const targetReached = isLong 
          ? price >= target.level 
          : price <= target.level;
        
        if (targetReached) {
          target.reached = true;
          target.reachedAt = priceTimestamp;
          newTargetsReached++;
          
          // Add update message
          signal.updates = signal.updates || [];
          signal.updates.push({
            message: `TP${i + 1} reached at price ${price}`,
            type: 'TP_REACHED',
            timestamp: priceTimestamp
          });
        }
      }
    }
    
    // Update reached targets count
    signal.reachedTargets = (signal.reachedTargets || 0) + newTargetsReached;
    
    // Update status
    if (signal.reachedTargets === signal.targets.length) {
      signal.status = 'COMPLETED';
    } else if (signal.reachedTargets > 0) {
      signal.status = 'PARTIAL';
    }
    
    // Check stop loss (for LONG: price <= stopLoss, for SHORT: price >= stopLoss)
    const stopLossHit = isLong 
      ? price <= signal.stopLoss 
      : price >= signal.stopLoss;
    
    if (stopLossHit && signal.status !== 'STOPPED') {
      signal.status = 'STOPPED';
      signal.updates = signal.updates || [];
      signal.updates.push({
        message: `Stop loss hit at price ${price}`,
        type: 'SL_HIT',
        timestamp: priceTimestamp
      });
    }
    
    signal.updatedAt = priceTimestamp;
    await signal.save();
    
    if (newTargetsReached > 0) {
      logger.info(`Target(s) reached for signal ${signal._id}`, {
        signalId: signal._id,
        pair: signal.pair,
        price,
        newTargetsReached,
        status: signal.status
      });
    }
    
    logger.info(`Price updated for ${signal.pair}: ${price} (Signal: ${signal._id.toString().substring(0, 8)})`, {
      signalId: signal._id,
      pair: signal.pair,
      symbol: signal.symbol,
      price,
      status: signal.status,
      priceHistoryCount: signal.priceHistory?.length || 0
    });
  } catch (error) {
    logger.error(`Error updating price for signal ${signal._id}`, {
      signalId: signal._id,
      pair: signal.pair,
      error: error.message
    });
  }
}

/**
 * Process all active signals and update their prices
 */
async function processActiveSignals() {
  try {
    // Find all active signals (ACTIVE and PARTIAL are still active trades)
    const activeSignals = await Signal.find({ 
      status: { $in: ['ACTIVE', 'PARTIAL'] } 
    }).select('_id pair symbol status type');
    
    if (activeSignals.length === 0) {
      logger.debug('No active signals to process');
      return;
    }
    
    // Get unique symbols/pairs to fetch
    const uniquePairs = [...new Set(activeSignals.map(s => s.pair))];
    
    logger.info(`Processing ${activeSignals.length} active signal(s) with ${uniquePairs.length} unique pair(s)`, {
      count: activeSignals.length,
      pairs: uniquePairs,
      signals: activeSignals.map(s => ({
        id: s._id.toString().substring(0, 8),
        pair: s.pair,
        symbol: s.symbol,
        status: s.status
      }))
    });
    
    // Fetch full signal documents and process all signals in parallel
    const fullSignals = await Signal.find({ 
      status: { $in: ['ACTIVE', 'PARTIAL'] } 
    });
    
    await Promise.all(fullSignals.map(signal => updateSignalPrice(signal)));
    
  } catch (error) {
    logger.error('Error processing active signals', {
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Start the price fetching service
 * Fetches prices every 5 seconds from MEXC
 */
let priceInterval = null;

export function startPriceFetcher() {
  if (priceInterval) {
    logger.warn('Price fetcher is already running');
    return;
  }
  
  logger.info('Starting price fetcher service (MEXC Contract Fair Price API)', {
    interval: '5 seconds',
    api: 'MEXC Contract',
    endpoint: 'contract/fair_price'
  });
  
  // Process immediately on start (with a small delay to ensure DB is ready)
  setTimeout(() => {
    processActiveSignals();
  }, 2000);
  
  // Then process every 5 seconds
  priceInterval = setInterval(() => {
    processActiveSignals();
  }, 5000);
}

/**
 * Stop the price fetching service
 */
export function stopPriceFetcher() {
  if (priceInterval) {
    clearInterval(priceInterval);
    priceInterval = null;
    logger.info('Price fetcher service stopped');
  }
}
