import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  telegramId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String
  },
  description: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalSignals: {
    type: Number,
    default: 0
  },
  totalWins: {
    type: Number,
    default: 0
  },
  totalLosses: {
    type: Number,
    default: 0
  },
  totalPartial: {
    type: Number,
    default: 0
  },
  averageWinRate: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

channelSchema.index({ isActive: 1 });

export default mongoose.model('Channel', channelSchema);

