const { google } = require('googleapis');
const Integration = require('../../models/Integration');

class GoogleIntegrationService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/integrations/google/callback`
    );

    // Scopes for different Google services
    this.scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.file',
      'profile',
      'email'
    ];
  }

  // Generate OAuth URL
  getAuthUrl(userId) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      state: userId,
      prompt: 'consent'
    });
  }

  // Exchange auth code for tokens
  async exchangeCodeForTokens(code, userId) {
    try {
      const { tokens } = await this.oauth2Client.getAccessToken(code);
      
      // Store tokens in database
      await Integration.findOneAndUpdate(
        { userId, platform: 'google' },
        {
          userId,
          platform: 'google',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: new Date(tokens.expiry_date),
          status: 'connected',
          scopes: this.scopes
        },
        { upsert: true, new: true }
      );

      return tokens;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw new Error('Failed to connect Google account');
    }
  }

  // Get authenticated client for user
  async getAuthenticatedClient(userId) {
    const integration = await Integration.findOne({ 
      userId, 
      platform: 'google',
      status: 'connected'
    });

    if (!integration) {
      throw new Error('Google integration not found or not connected');
    }

    this.oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken
    });

    // Check if token needs refresh
    if (new Date() >= integration.tokenExpiry) {
      try {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        
        // Update stored tokens
        integration.accessToken = credentials.access_token;
        if (credentials.refresh_token) {
          integration.refreshToken = credentials.refresh_token;
        }
        integration.tokenExpiry = new Date(credentials.expiry_date);
        await integration.save();

        this.oauth2Client.setCredentials(credentials);
      } catch (error) {
        console.error('Token refresh error:', error);
        integration.status = 'error';
        await integration.save();
        throw new Error('Failed to refresh Google tokens');
      }
    }

    return this.oauth2Client;
  }

  // Calendar Methods
  async getCalendarEvents(userId, timeMin, timeMax) {
    try {
      const auth = await this.getAuthenticatedClient(userId);
      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Get calendar events error:', error);
      throw new Error('Failed to fetch calendar events');
    }
  }

  async createCalendarEvent(userId, eventData) {
    try {
      const auth = await this.getAuthenticatedClient(userId);
      const calendar = google.calendar({ version: 'v3', auth });

      const event = {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.startTime,
          timeZone: eventData.timeZone || 'UTC'
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: eventData.timeZone || 'UTC'
        },
        attendees: eventData.attendees?.map(email => ({ email })) || [],
        conferenceData: eventData.createMeetLink ? {
          createRequest: {
            requestId: Math.random().toString(36).substring(7),
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        } : undefined
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: eventData.createMeetLink ? 1 : 0,
        sendUpdates: 'all'
      });

      return response.data;
    } catch (error) {
      console.error('Create calendar event error:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  async findAvailableSlots(userId, duration = 60, daysAhead = 7) {
    try {
      const events = await this.getCalendarEvents(
        userId,
        new Date().toISOString(),
        new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString()
      );

      const workingHours = { start: 9, end: 17 }; // 9 AM to 5 PM
      const availableSlots = [];

      for (let day = 0; day < daysAhead; day++) {
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + day);
        
        // Skip weekends
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;

        const dayEvents = events.filter(event => {
          const eventDate = new Date(event.start.dateTime || event.start.date);
          return eventDate.toDateString() === currentDate.toDateString();
        }).sort((a, b) => new Date(a.start.dateTime) - new Date(b.start.dateTime));

        // Find gaps between events
        let currentTime = new Date(currentDate);
        currentTime.setHours(workingHours.start, 0, 0, 0);

        for (const event of dayEvents) {
          const eventStart = new Date(event.start.dateTime || event.start.date);
          const eventEnd = new Date(event.end.dateTime || event.end.date);

          // Check if there's a gap before this event
          const gapDuration = eventStart - currentTime;
          if (gapDuration >= duration * 60 * 1000) {
            availableSlots.push({
              start: new Date(currentTime),
              end: new Date(eventStart),
              duration: Math.floor(gapDuration / (60 * 1000))
            });
          }

          currentTime = eventEnd;
        }

        // Check for availability after the last event
        const endOfDay = new Date(currentDate);
        endOfDay.setHours(workingHours.end, 0, 0, 0);
        
        if (currentTime < endOfDay) {
          const remainingTime = endOfDay - currentTime;
          if (remainingTime >= duration * 60 * 1000) {
            availableSlots.push({
              start: new Date(currentTime),
              end: endOfDay,
              duration: Math.floor(remainingTime / (60 * 1000))
            });
          }
        }
      }

      return availableSlots.slice(0, 10); // Return top 10 slots
    } catch (error) {
      console.error('Find available slots error:', error);
      throw new Error('Failed to find available time slots');
    }
  }

  // Gmail Methods
  async getRecentEmails(userId, maxResults = 10) {
    try {
      const auth = await this.getAuthenticatedClient(userId);
      const gmail = google.gmail({ version: 'v1', auth });

      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'in:inbox'
      });

      const messages = response.data.messages || [];
      const emailDetails = [];

      for (const message of messages) {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date']
        });

        const headers = detail.data.payload.headers;
        emailDetails.push({
          id: message.id,
          from: headers.find(h => h.name === 'From')?.value,
          subject: headers.find(h => h.name === 'Subject')?.value,
          date: headers.find(h => h.name === 'Date')?.value,
          threadId: detail.data.threadId
        });
      }

      return emailDetails;
    } catch (error) {
      console.error('Get recent emails error:', error);
      throw new Error('Failed to fetch emails');
    }
  }

  async sendEmail(userId, emailData) {
    try {
      const auth = await this.getAuthenticatedClient(userId);
      const gmail = google.gmail({ version: 'v1', auth });

      const email = [
        `To: ${emailData.to}`,
        emailData.cc ? `Cc: ${emailData.cc}` : '',
        emailData.bcc ? `Bcc: ${emailData.bcc}` : '',
        `Subject: ${emailData.subject}`,
        '',
        emailData.body
      ].filter(line => line).join('\n');

      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: encodedEmail
        }
      });

      return response.data;
    } catch (error) {
      console.error('Send email error:', error);
      throw new Error('Failed to send email');
    }
  }

  async draftEmail(userId, emailData) {
    try {
      const auth = await this.getAuthenticatedClient(userId);
      const gmail = google.gmail({ version: 'v1', auth });

      const email = [
        `To: ${emailData.to}`,
        emailData.cc ? `Cc: ${emailData.cc}` : '',
        emailData.bcc ? `Bcc: ${emailData.bcc}` : '',
        `Subject: ${emailData.subject}`,
        '',
        emailData.body
      ].filter(line => line).join('\n');

      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await gmail.users.drafts.create({
        userId: 'me',
        resource: {
          message: {
            raw: encodedEmail
          }
        }
      });

      return response.data;
    } catch (error) {
      console.error('Draft email error:', error);
      throw new Error('Failed to create email draft');
    }
  }

  // Google Drive Methods
  async searchFiles(userId, query, maxResults = 10) {
    try {
      const auth = await this.getAuthenticatedClient(userId);
      const drive = google.drive({ version: 'v3', auth });

      const response = await drive.files.list({
        q: query,
        pageSize: maxResults,
        fields: 'files(id, name, mimeType, modifiedTime, webViewLink, owners)'
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Search files error:', error);
      throw new Error('Failed to search files');
    }
  }

  async createFolder(userId, folderName, parentId = null) {
    try {
      const auth = await this.getAuthenticatedClient(userId);
      const drive = google.drive({ version: 'v3', auth });

      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined
      };

      const response = await drive.files.create({
        resource: folderMetadata,
        fields: 'id, name, webViewLink'
      });

      return response.data;
    } catch (error) {
      console.error('Create folder error:', error);
      throw new Error('Failed to create folder');
    }
  }

  // Disconnect integration
  async disconnect(userId) {
    try {
      await Integration.findOneAndUpdate(
        { userId, platform: 'google' },
        { status: 'disconnected', disconnectedAt: new Date() }
      );
      return true;
    } catch (error) {
      console.error('Disconnect Google integration error:', error);
      throw new Error('Failed to disconnect Google integration');
    }
  }
}

module.exports = new GoogleIntegrationService();
