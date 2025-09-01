const { google } = require('googleapis');
const Integration = require('../../models/Integration');

class GoogleIntegrationService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/integrations/google/callback'
    );

    this.scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/drive.readonly',
      'profile',
      'email'
    ];
  }

  getAuthUrl(userId) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      state: userId,
      prompt: 'consent'
    });
  }

  async exchangeCodeForTokens(code, userId) {
    try {
      const { tokens } = await this.oauth2Client.getAccessToken(code);
      
      // Get user info
      this.oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      
      // Store tokens
      await Integration.findOneAndUpdate(
        { userId, platform: 'google' },
        {
          userId,
          platform: 'google',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: new Date(tokens.expiry_date),
          status: 'connected',
          scopes: this.scopes,
          accountInfo: {
            email: userInfo.data.email,
            name: userInfo.data.name,
            id: userInfo.data.id
          }
        },
        { upsert: true, new: true }
      );

      return tokens;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw new Error('Failed to connect Google account');
    }
  }

  async getAuthenticatedClient(userId) {
    const integration = await Integration.findOne({ 
      userId, 
      platform: 'google',
      status: 'connected'
    });

    if (!integration) {
      throw new Error('Google integration not connected');
    }

    this.oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken
    });

    return this.oauth2Client;
  }

  async getCalendarEvents(userId, timeMin, timeMax) {
    try {
      const auth = await this.getAuthenticatedClient(userId);
      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Get calendar events error:', error);
      throw new Error('Failed to fetch calendar events');
    }
  }
}

module.exports = new GoogleIntegrationService();