const express = require('express');
const router = express.Router();

// Get integrations
router.get('/', (req, res) => {
  res.json([]);
});

module.exports = router;
