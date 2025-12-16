import mongoose from 'mongoose';

const signalSchema = new mongoose.Schema({
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
    index: true
  },
  channelName: {
    type: String,
    required: true
  },
  messageId: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['LONG', 'SHORT'],
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  pair: {
    type: String,
    required: true
  },
  entry: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    userEntry: { type: Number } // Optional user entry price
  },
  targets: [{
    level: { type: Number, required: true },
    reached: { type: Boolean, default: false },
    reachedAt: { type: Date }
  }],
  stopLoss: {
    type: Number,
    required: true
  },
  leverage: {
    type: String
  },
  priceHistory: [{
    price: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['ACTIVE', 'COMPLETED', 'STOPPED', 'PARTIAL'],
    default: 'ACTIVE'
  },
  currentPrice: {
    type: Number
  },
  reachedTargets: {
    type: Number,
    default: 0
  },
  updates: [{
    message: String,
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['TP_REACHED', 'SL_HIT', 'UPDATE', 'PROFIT_LOCKED'] }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

signalSchema.index({ channelId: 1, createdAt: -1 });
signalSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Signal', signalSchema);

