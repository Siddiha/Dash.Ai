const express = require('express');
const router = express.Router();

// Get chat history
router.get('/history', (req, res) => {
  res.json({ messages: [] });
});

// Get chat suggestions
router.post('/suggestions', (req, res) => {
  res.json({ suggestions: ['Hello', 'How are you?', 'Help me with a task'] });
});

module.exports = router;
