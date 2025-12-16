import express from 'express';
import Channel from '../models/Channel.js';
import Signal from '../models/Signal.js';

const router = express.Router();

// Get overall statistics
router.get('/overview', async (req, res) => {
  try {
    const channels = await Channel.find({ isActive: true });
    const signals = await Signal.find();
    
    const overview = {
      totalChannels: channels.length,
      totalSignals: signals.length,
      activeSignals: signals.filter(s => s.status === 'ACTIVE').length,
      completedSignals: signals.filter(s => s.status === 'COMPLETED').length,
      stoppedSignals: signals.filter(s => s.status === 'STOPPED').length,
      partialSignals: signals.filter(s => s.status === 'PARTIAL').length,
      overallWinRate: 0,
      totalWins: signals.filter(s => s.status === 'COMPLETED' || s.reachedTargets > 0).length,
      totalLosses: signals.filter(s => s.status === 'STOPPED').length
    };
    
    if (overview.totalSignals > 0) {
      overview.overallWinRate = ((overview.totalWins / overview.totalSignals) * 100).toFixed(2);
    }
    
    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get best performing channels
router.get('/best-channels', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const channels = await Channel.find({ isActive: true });
    
    const channelStats = await Promise.all(
      channels.map(async (channel) => {
        const signals = await Signal.find({ channelId: channel._id });
        
        if (signals.length === 0) {
          return null;
        }
        
        const wins = signals.filter(s => s.status === 'COMPLETED' || s.reachedTargets > 0).length;
        const losses = signals.filter(s => s.status === 'STOPPED').length;
        const winRate = (wins / signals.length) * 100;
        const avgTargetsReached = signals.reduce((sum, s) => sum + s.reachedTargets, 0) / signals.length;
        
        return {
          channelId: channel._id,
          channelName: channel.name,
          totalSignals: signals.length,
          wins,
          losses,
          winRate: winRate.toFixed(2),
          averageTargetsReached: avgTargetsReached.toFixed(2),
          completed: signals.filter(s => s.status === 'COMPLETED').length,
          stopped: signals.filter(s => s.status === 'STOPPED').length
        };
      })
    );
    
    const validStats = channelStats.filter(s => s !== null);
    validStats.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
    
    res.json(validStats.slice(0, parseInt(limit)));
  } catch (error) {
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
          const wins = signals.filter(s => s.status === 'COMPLETED' || s.reachedTargets > 0).length;
          stats.winRate = ((wins / signals.length) * 100).toFixed(2);
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
    
    const trends = Object.values(dailyStats).map(stat => ({
      ...stat,
      winRate: stat.total > 0 ? ((stat.wins / stat.total) * 100).toFixed(2) : '0.00'
    }));
    
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

