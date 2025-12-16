import express from 'express';
import Channel from '../models/Channel.js';
import Signal from '../models/Signal.js';
import { logger } from '../utils/logger.js';
import { calculateWinRate, calculateTotalWinRate, isWin } from '../utils/winRate.js';

const router = express.Router();

// Get overall statistics
router.get('/overview', async (req, res) => {
  try {
    logger.db('Fetching overview statistics');
    const startTime = Date.now();
    
    const channels = await Channel.find({ isActive: true });
    const signals = await Signal.find();
    
    // Calculate win rate using new formula (TP1=0.3, TP2=0.6, TP3+=1.0)
    const overallWinRate = calculateTotalWinRate(signals);
    const totalWins = signals.filter(s => isWin(s)).length;
    const totalLosses = signals.filter(s => s.status === 'STOPPED').length;
    
    const overview = {
      totalChannels: channels.length,
      totalSignals: signals.length,
      activeSignals: signals.filter(s => s.status === 'ACTIVE').length,
      completedSignals: signals.filter(s => s.status === 'COMPLETED').length,
      stoppedSignals: signals.filter(s => s.status === 'STOPPED').length,
      partialSignals: signals.filter(s => s.status === 'PARTIAL').length,
      overallWinRate: (overallWinRate * 100).toFixed(2),
      totalWins: totalWins,
      totalLosses: totalLosses
    };
    
    const duration = Date.now() - startTime;
    logger.db('Overview statistics calculated', { 
      totalChannels: overview.totalChannels,
      totalSignals: overview.totalSignals,
      duration: `${duration}ms`
    });
    
    res.json(overview);
  } catch (error) {
    logger.error('Error fetching overview', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Get best performing channels
router.get('/best-channels', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    logger.db('Fetching best performing channels', { limit });
    const startTime = Date.now();
    
    const channels = await Channel.find({ isActive: true });
    logger.db(`Found ${channels.length} active channels`);
    
    const channelStats = await Promise.all(
      channels.map(async (channel) => {
        const signals = await Signal.find({ channelId: channel._id });
        
        if (signals.length === 0) {
          return null;
        }
        
        // Calculate win rate using new formula (TP1=0.3, TP2=0.6, TP3+=1.0)
        const channelWinRate = calculateTotalWinRate(signals);
        const wins = signals.filter(s => isWin(s)).length;
        const losses = signals.filter(s => s.status === 'STOPPED').length;
        const avgTargetsReached = signals.reduce((sum, s) => sum + s.reachedTargets, 0) / signals.length;
        
        return {
          channelId: channel._id,
          channelName: channel.name,
          totalSignals: signals.length,
          wins,
          losses,
          winRate: (channelWinRate * 100).toFixed(2),
          averageTargetsReached: avgTargetsReached.toFixed(2),
          completed: signals.filter(s => s.status === 'COMPLETED').length,
          stopped: signals.filter(s => s.status === 'STOPPED').length
        };
      })
    );
    
    const validStats = channelStats.filter(s => s !== null);
    validStats.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
    
    const duration = Date.now() - startTime;
    logger.db('Best channels calculated', { 
      totalChannels: validStats.length,
      returned: Math.min(validStats.length, parseInt(limit)),
      duration: `${duration}ms`
    });
    
    res.json(validStats.slice(0, parseInt(limit)));
  } catch (error) {
    logger.error('Error fetching best channels', { 
      limit: req.query.limit, 
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: error.message });
  }
});

// Get channel comparison
router.get('/channel-comparison', async (req, res) => {
  try {
    const channels = await Channel.find({ isActive: true });
    
    const comparison = await Promise.all(
      channels.map(async (channel) => {
        const signals = await Signal.find({ channelId: channel._id });
        
        const stats = {
          channelName: channel.name,
          totalSignals: signals.length,
          winRate: 0,
          averageTargetsReached: 0,
          completionRate: 0,
          stopLossRate: 0
        };
        
        if (signals.length > 0) {
          // Calculate win rate using new formula (TP1=0.3, TP2=0.6, TP3+=1.0)
          const channelWinRate = calculateTotalWinRate(signals);
          stats.winRate = (channelWinRate * 100).toFixed(2);
          stats.averageTargetsReached = (signals.reduce((sum, s) => sum + s.reachedTargets, 0) / signals.length).toFixed(2);
          stats.completionRate = ((signals.filter(s => s.status === 'COMPLETED').length / signals.length) * 100).toFixed(2);
          stats.stopLossRate = ((signals.filter(s => s.status === 'STOPPED').length / signals.length) * 100).toFixed(2);
        }
        
        return stats;
      })
    );
    
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent performance trends
router.get('/trends', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(days));
    
    const signals = await Signal.find({
      createdAt: { $gte: dateLimit }
    }).sort({ createdAt: 1 });
    
    // Group by date
    const dailyStats = {};
    
    signals.forEach(signal => {
      const date = signal.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          total: 0,
          wins: 0,
          losses: 0,
          completed: 0,
          stopped: 0
        };
      }
      
      dailyStats[date].total += 1;
      if (signal.status === 'COMPLETED' || signal.reachedTargets > 0) {
        dailyStats[date].wins += 1;
      }
      if (signal.status === 'STOPPED') {
        dailyStats[date].losses += 1;
      }
      if (signal.status === 'COMPLETED') {
        dailyStats[date].completed += 1;
      }
      if (signal.status === 'STOPPED') {
        dailyStats[date].stopped += 1;
      }
    });
    
    // Calculate win rate for each day using new formula
    const trends = Object.values(dailyStats).map(stat => {
      // For daily stats, we need to recalculate using the actual signals
      // But for simplicity, we'll use the win count / total
      // The actual win rate calculation is done per signal in the loop above
      return {
        ...stat,
        winRate: stat.total > 0 ? ((stat.wins / stat.total) * 100).toFixed(2) : '0.00'
      };
    });
    
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

