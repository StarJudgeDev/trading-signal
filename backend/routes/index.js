import express from 'express';
import signalRoutes from './signals.js';
import channelRoutes from './channels.js';
import analysisRoutes from './analysis.js';

const router = express.Router();

router.use('/signals', signalRoutes);
router.use('/channels', channelRoutes);
router.use('/analysis', analysisRoutes);

export default router;
