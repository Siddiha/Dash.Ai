const express = require('express');
const Integration = require('../models/Integration');
const { authenticate } = require('../middleware/auth');
const googleService = require('../services/integrations/googleService');

const router = express.Router();

// Get user integrations
router.get('/', authenticate, async (req, res) => {
  try {
    const integrations = await Integration.find({ userId: req.user._id });
    res.json(integrations);
  } catch (error) {
    console.error('Get integrations error:', error);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

// Connect Google integration
router.post('/google/connect', authenticate, async (req, res) => {
  try {
    const authUrl = googleService.getAuthUrl(req.user._id.toString());
    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('Google connect error:', error);
    res.status(500).json({ error: 'Failed to initiate Google connection' });
  }
});

// Google OAuth callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;
    
    if (!code || !userId) {
      return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=missing_params`);
    }

    await googleService.exchangeCodeForTokens(code, userId);
    res.redirect(`${process.env.FRONTEND_URL}/integrations?success=google_connected`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/integrations?error=connection_failed`);
  }
});

// Disconnect integration
router.post('/:platform/disconnect', authenticate, async (req, res) => {
  try {
    const { platform } = req.params;
    
    await Integration.findOneAndUpdate(
      { userId: req.user._id, platform },
      { status: 'disconnected', disconnectedAt: new Date() }
    );

    res.json({ success: true, message: 'Integration disconnected' });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect integration' });
  }
});

// Test integration
router.post('/:platform/test', authenticate, async (req, res) => {
  try {
    const { platform } = req.params;
    
    if (platform === 'google') {
      const events = await googleService.getCalendarEvents(req.user._id);
      res.json({ success: true, message: 'Google integration working!', data: events.slice(0, 3) });
    } else {
      res.json({ success: true, message: `${platform} test not implemented yet` });
    }
  } catch (error) {
    console.error('Test integration error:', error);
    res.status(500).json({ error: `Failed to test ${req.params.platform} integration` });
  }
});

module.exports = router;