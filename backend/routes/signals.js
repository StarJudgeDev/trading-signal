import express from 'express';
import Signal from '../models/Signal.js';

const router = express.Router();

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
    
    res.json({
      signal,
      newTargetsReached,
      message: newTargetsReached > 0 
        ? `${newTargetsReached} target(s) reached` 
        : 'Price updated'
    });
  } catch (error) {
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

