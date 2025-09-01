const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversationId: {
    type: String,
    default: 'default'
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  metadata: {
    intent: String,
    confidence: Number,
    entities: Object,
    requiresIntegration: Boolean,
    integrationNeeded: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);