import express from 'express';
import Signal from '../models/Signal.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Helper function to sort price history by timestamp (newest first)
const sortPriceHistory = (priceHistory) => {
  if (!priceHistory || priceHistory.length === 0) return;
  priceHistory.sort((a, b) => {
    const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
    const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
    return dateB - dateA; // Newest first (descending)
  });
};

// Get all signals
router.get('/', async (req, res) => {
  try {
    const { channelId, status, limit = 50, page = 1 } = req.query;
    const query = {};
    
    if (channelId) query.channelId = channelId;
    if (status) query.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const signals = await Signal.find(query)
      .populate('channelId', 'name username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Signal.countDocuments(query);
    
    res.json({
      signals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get signal by ID
router.get('/:id', async (req, res) => {
  try {
    const signal = await Signal.findById(req.params.id)
      .populate('channelId', 'name username');
    
    if (!signal) {
      return res.status(404).json({ error: 'Signal not found' });
    }
    
    // Sort price history by timestamp (newest first)
    sortPriceHistory(signal.priceHistory);
    
    res.json(signal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create signal manually
router.post('/', async (req, res) => {
  try {
    const signal = new Signal(req.body);
    await signal.save();
    // Sort price history by timestamp (newest first)
    sortPriceHistory(signal.priceHistory);
    res.status(201).json(signal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update signal
router.put('/:id', async (req, res) => {
  try {
    const signal = await Signal.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!signal) {
      return res.status(404).json({ error: 'Signal not found' });
    }
    
    // Sort price history by timestamp (newest first)
    sortPriceHistory(signal.priceHistory);
    
    res.json(signal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update price and automatically check TPs
router.post('/:id/price', async (req, res) => {
  try {
    const { price, timestamp } = req.body;
    
    if (!price || isNaN(price)) {
      return res.status(400).json({ error: 'Valid price is required' });
    }
    
    const signal = await Signal.findById(req.params.id);
    
    if (!signal) {
      return res.status(404).json({ error: 'Signal not found' });
    }
    
    const priceValue = parseFloat(price);
    const priceTimestamp = timestamp ? new Date(timestamp) : new Date();
    
    // Add price to history
    signal.priceHistory = signal.priceHistory || [];
    signal.priceHistory.push({
      price: priceValue,
      timestamp: priceTimestamp
    });
    
    // Update current price
    signal.currentPrice = priceValue;
    
    // Check if price reached any targets (for LONG: price >= target, for SHORT: price <= target)
    let newTargetsReached = 0;
    const isLong = signal.type === 'LONG';
    
    for (let i = 0; i < signal.targets.length; i++) {
      const target = signal.targets[i];
      if (!target.reached) {
        const targetReached = isLong 
          ? priceValue >= target.level 
          : priceValue <= target.level;
        
        if (targetReached) {
          target.reached = true;
          target.reachedAt = priceTimestamp;
          newTargetsReached++;
          
          // Add update message
          signal.updates = signal.updates || [];
          signal.updates.push({
            message: `TP${i + 1} reached at price ${priceValue}`,
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
      ? priceValue <= signal.stopLoss 
      : priceValue >= signal.stopLoss;
    
    if (stopLossHit && signal.status !== 'STOPPED') {
      signal.status = 'STOPPED';
      signal.updates = signal.updates || [];
      signal.updates.push({
        message: `Stop loss hit at price ${priceValue}`,
        type: 'SL_HIT',
        timestamp: priceTimestamp
      });
    }
    
    signal.updatedAt = new Date();
    await signal.save();
    
    // Sort price history by timestamp (newest first)
    sortPriceHistory(signal.priceHistory);
    
    logger.db('Price updated successfully', { 
      signalId: signal._id, 
      price: priceValue, 
      newTargetsReached,
      status: signal.status
    });
    
    res.json({
      signal,
      newTargetsReached,
      message: newTargetsReached > 0 
        ? `${newTargetsReached} target(s) reached` 
        : 'Price updated'
    });
  } catch (error) {
    logger.error('Error updating price', { signalId: req.params.id, error: error.message });
    res.status(400).json({ error: error.message });
  }
});

// Update price history entry
router.put('/:id/price/:index', async (req, res) => {
  try {
    const { price, timestamp } = req.body;
    const priceIndex = parseInt(req.params.index);
    
    if (!price || isNaN(price)) {
      return res.status(400).json({ error: 'Valid price is required' });
    }
    
    const signal = await Signal.findById(req.params.id);
    
    if (!signal) {
      return res.status(404).json({ error: 'Signal not found' });
    }
    
    if (!signal.priceHistory || priceIndex < 0 || priceIndex >= signal.priceHistory.length) {
      return res.status(400).json({ error: 'Invalid price index' });
    }
    
    const priceValue = parseFloat(price);
    const priceTimestamp = timestamp ? new Date(timestamp) : signal.priceHistory[priceIndex].timestamp;
    
    // Update the price entry
    signal.priceHistory[priceIndex].price = priceValue;
    signal.priceHistory[priceIndex].timestamp = priceTimestamp;
    
    // Update current price if this is the latest entry
    if (priceIndex === signal.priceHistory.length - 1) {
      signal.currentPrice = priceValue;
    }
    
    // Recalculate all targets based on price history
    // Reset all targets first
    signal.targets.forEach(target => {
      target.reached = false;
      target.reachedAt = null;
    });
    signal.reachedTargets = 0;
    signal.updates = signal.updates || [];
    
    // Check all prices in chronological order
    const isLong = signal.type === 'LONG';
    const sortedPrices = [...signal.priceHistory].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    for (const priceEntry of sortedPrices) {
      for (let i = 0; i < signal.targets.length; i++) {
        const target = signal.targets[i];
        if (!target.reached) {
          const targetReached = isLong 
            ? priceEntry.price >= target.level 
            : priceEntry.price <= target.level;
          
          if (targetReached) {
            target.reached = true;
            target.reachedAt = priceEntry.timestamp;
            signal.reachedTargets++;
            
            signal.updates.push({
              message: `TP${i + 1} reached at price ${priceEntry.price}`,
              type: 'TP_REACHED',
              timestamp: priceEntry.timestamp
            });
          }
        }
      }
      
      // Check stop loss
      const stopLossHit = isLong 
        ? priceEntry.price <= signal.stopLoss 
        : priceEntry.price >= signal.stopLoss;
      
      if (stopLossHit) {
        signal.status = 'STOPPED';
        signal.updates.push({
          message: `Stop loss hit at price ${priceEntry.price}`,
          type: 'SL_HIT',
          timestamp: priceEntry.timestamp
        });
        break;
      }
    }
    
    // Update status
    if (signal.status !== 'STOPPED') {
      if (signal.reachedTargets === signal.targets.length) {
        signal.status = 'COMPLETED';
      } else if (signal.reachedTargets > 0) {
        signal.status = 'PARTIAL';
      } else {
        signal.status = 'ACTIVE';
      }
    }
    
    signal.updatedAt = new Date();
    await signal.save();
    
    // Sort price history by timestamp (newest first)
    sortPriceHistory(signal.priceHistory);
    
    logger.db('Price history entry updated', { 
      signalId: signal._id, 
      index: priceIndex,
      price: priceValue
    });
    
    res.json(signal);
  } catch (error) {
    logger.error('Error updating price history', { signalId: req.params.id, error: error.message });
    res.status(400).json({ error: error.message });
  }
});

// Delete price history entry
router.delete('/:id/price/:index', async (req, res) => {
  try {
    const priceIndex = parseInt(req.params.index);
    
    const signal = await Signal.findById(req.params.id);
    
    if (!signal) {
      return res.status(404).json({ error: 'Signal not found' });
    }
    
    if (!signal.priceHistory || priceIndex < 0 || priceIndex >= signal.priceHistory.length) {
      return res.status(400).json({ error: 'Invalid price index' });
    }
    
    // Remove the price entry
    signal.priceHistory.splice(priceIndex, 1);
    
    // Update current price if there are remaining entries
    if (signal.priceHistory.length > 0) {
      const latestPrice = signal.priceHistory[signal.priceHistory.length - 1];
      signal.currentPrice = latestPrice.price;
    } else {
      signal.currentPrice = null;
    }
    
    // Recalculate all targets based on remaining price history
    // Reset all targets first
    signal.targets.forEach(target => {
      target.reached = false;
      target.reachedAt = null;
    });
    signal.reachedTargets = 0;
    signal.updates = signal.updates || [];
    
    // Check all remaining prices in chronological order
    const isLong = signal.type === 'LONG';
    const sortedPrices = [...signal.priceHistory].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    for (const priceEntry of sortedPrices) {
      for (let i = 0; i < signal.targets.length; i++) {
        const target = signal.targets[i];
        if (!target.reached) {
          const targetReached = isLong 
            ? priceEntry.price >= target.level 
            : priceEntry.price <= target.level;
          
          if (targetReached) {
            target.reached = true;
            target.reachedAt = priceEntry.timestamp;
            signal.reachedTargets++;
            
            signal.updates.push({
              message: `TP${i + 1} reached at price ${priceEntry.price}`,
              type: 'TP_REACHED',
              timestamp: priceEntry.timestamp
            });
          }
        }
      }
      
      // Check stop loss
      const stopLossHit = isLong 
        ? priceEntry.price <= signal.stopLoss 
        : priceEntry.price >= signal.stopLoss;
      
      if (stopLossHit) {
        signal.status = 'STOPPED';
        signal.updates.push({
          message: `Stop loss hit at price ${priceEntry.price}`,
          type: 'SL_HIT',
          timestamp: priceEntry.timestamp
        });
        break;
      }
    }
    
    // Update status
    if (signal.status !== 'STOPPED') {
      if (signal.reachedTargets === signal.targets.length) {
        signal.status = 'COMPLETED';
      } else if (signal.reachedTargets > 0) {
        signal.status = 'PARTIAL';
      } else {
        signal.status = 'ACTIVE';
      }
    }
    
    signal.updatedAt = new Date();
    await signal.save();
    
    // Sort price history by timestamp (newest first)
    sortPriceHistory(signal.priceHistory);
    
    logger.db('Price history entry deleted', { 
      signalId: signal._id, 
      index: priceIndex
    });
    
    res.json(signal);
  } catch (error) {
    logger.error('Error deleting price history', { signalId: req.params.id, error: error.message });
    res.status(400).json({ error: error.message });
  }
});

// Delete signal
router.delete('/:id', async (req, res) => {
  try {
    const signal = await Signal.findByIdAndDelete(req.params.id);
    
    if (!signal) {
      return res.status(404).json({ error: 'Signal not found' });
    }
    
    res.json({ message: 'Signal deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

