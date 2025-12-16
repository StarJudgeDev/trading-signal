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

// Mark target as reached
router.post('/:id/targets/:targetIndex/reach', async (req, res) => {
  try {
    const signal = await Signal.findById(req.params.id);
    
    if (!signal) {
      return res.status(404).json({ error: 'Signal not found' });
    }
    
    const targetIndex = parseInt(req.params.targetIndex);
    if (targetIndex < 0 || targetIndex >= signal.targets.length) {
      return res.status(400).json({ error: 'Invalid target index' });
    }
    
    if (!signal.targets[targetIndex].reached) {
      signal.targets[targetIndex].reached = true;
      signal.targets[targetIndex].reachedAt = new Date();
      signal.reachedTargets += 1;
      
      if (signal.reachedTargets === signal.targets.length) {
        signal.status = 'COMPLETED';
      } else if (signal.reachedTargets > 0) {
        signal.status = 'PARTIAL';
      }
      
      signal.updatedAt = new Date();
      await signal.save();
    }
    
    res.json(signal);
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

