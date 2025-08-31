const express = require('express');
const router = express.Router();

// Get scheduling info
router.get('/', (req, res) => {
  res.json({ message: 'Scheduling service' });
});

module.exports = router;
