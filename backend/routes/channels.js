import express from 'express';
import Channel from '../models/Channel.js';
import Signal from '../models/Signal.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get all channels
router.get('/', async (req, res) => {
  try {
    const channels = await Channel.find()
      .sort({ createdAt: -1 });
    
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get channel by ID
router.get('/:id', async (req, res) => {
  try {
    logger.db('Fetching channel by ID', { id: req.params.id });
    const channel = await Channel.findById(req.params.id);
    
    if (!channel) {
      logger.warn('Channel not found', { id: req.params.id });
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    logger.db('Channel fetched successfully', { id: channel._id, name: channel.name });
    res.json(channel);
  } catch (error) {
    logger.error('Error fetching channel by ID', { id: req.params.id, error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Create channel
router.post('/', async (req, res) => {
  try {
    const channel = new Channel(req.body);
    await channel.save();
    res.status(201).json(channel);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update channel
router.put('/:id', async (req, res) => {
  try {
    logger.db('Updating channel', { id: req.params.id, updates: Object.keys(req.body) });
    const startTime = Date.now();
    
    const channel = await Channel.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!channel) {
      logger.warn('Channel not found for update', { id: req.params.id });
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const duration = Date.now() - startTime;
    logger.db('Channel updated successfully', { id: channel._id, duration: `${duration}ms` });
    
    res.json(channel);
  } catch (error) {
    logger.error('Error updating channel', { id: req.params.id, error: error.message });
    res.status(400).json({ error: error.message });
  }
});

// Get channel statistics
router.get('/:id/stats', async (req, res) => {
  try {
    logger.db('Fetching channel statistics', { id: req.params.id });
    const startTime = Date.now();
    
    const channel = await Channel.findById(req.params.id);
    
    if (!channel) {
      logger.warn('Channel not found for stats', { id: req.params.id });
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const signals = await Signal.find({ channelId: channel._id });
    
    const stats = {
      totalSignals: signals.length,
      active: signals.filter(s => s.status === 'ACTIVE').length,
      completed: signals.filter(s => s.status === 'COMPLETED').length,
      stopped: signals.filter(s => s.status === 'STOPPED').length,
      partial: signals.filter(s => s.status === 'PARTIAL').length,
      totalWins: signals.filter(s => s.status === 'COMPLETED' || s.reachedTargets > 0).length,
      totalLosses: signals.filter(s => s.status === 'STOPPED').length,
      winRate: 0,
      averageTargetsReached: 0
    };
    
    if (stats.totalSignals > 0) {
      stats.winRate = ((stats.totalWins / stats.totalSignals) * 100).toFixed(2);
      const totalTargetsReached = signals.reduce((sum, s) => sum + s.reachedTargets, 0);
      stats.averageTargetsReached = (totalTargetsReached / stats.totalSignals).toFixed(2);
    }
    
    const duration = Date.now() - startTime;
    logger.db('Channel statistics calculated', { 
      id: req.params.id, 
      totalSignals: stats.totalSignals,
      duration: `${duration}ms`
    });
    
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching channel statistics', { id: req.params.id, error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Delete channel
router.delete('/:id', async (req, res) => {
  try {
    logger.db('Deleting channel', { id: req.params.id });
    const channel = await Channel.findByIdAndDelete(req.params.id);
    
    if (!channel) {
      logger.warn('Channel not found for deletion', { id: req.params.id });
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    logger.db('Channel deleted successfully', { id: req.params.id, name: channel.name });
    res.json({ message: 'Channel deleted' });
  } catch (error) {
    logger.error('Error deleting channel', { id: req.params.id, error: error.message });
    res.status(500).json({ error: error.message });
  }
});

export default router;

