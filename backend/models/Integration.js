const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['google', 'microsoft', 'slack', 'notion', 'zoom', 'dropbox']
  },
  accessToken: String,
  refreshToken: String,
  tokenExpiry: Date,
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'error', 'connecting'],
    default: 'disconnected'
  },
  scopes: [String],
  accountInfo: {
    email: String,
    name: String,
    id: String
  },
  lastUsed: Date
}, {
  timestamps: true
});

integrationSchema.index({ userId: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model('Integration', integrationSchema);