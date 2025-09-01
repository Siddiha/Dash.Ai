const express = require('express');
const Message = require('../models/Message');
const { authenticate } = require('../middleware/auth');
const openaiService = require('../services/ai/openaiService');

const router = express.Router();

// Get chat history
router.get('/history', authenticate, async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('content type metadata createdAt');

    res.json({
      success: true,
      messages: messages.reverse()
    });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Generate suggestions
router.post('/suggestions', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    const suggestions = await openaiService.generateSmartSuggestions(req.user._id, message);
    
    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

module.exports = router;