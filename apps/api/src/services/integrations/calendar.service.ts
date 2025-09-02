import { google } from "googleapis";
import { BaseIntegration, IntegrationConfig } from "./base-integration";

export class CalendarService extends BaseIntegration {
  private calendar: any;
  private oauth2Client: any;

  constructor(config: IntegrationConfig) {
    super(config);
    this.initializeClient();
  }

  private initializeClient() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.oauth2Client.setCredentials({
      access_token: this.config.accessToken,
      refresh_token: this.config.refreshToken,
    });

    this.calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
  }

  async connect(): Promise<boolean> {
    try {
      await this.testConnection();
      return true;
    } catch (error) {
      await this.handleError(error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.oauth2Client.revokeCredentials();
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.calendar.calendarList.list();
      return !!response.data.items;
    } catch (error) {
      return false;
    }
  }

  async refreshTokens(): Promise<IntegrationConfig> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || this.config.refreshToken,
        expiresAt: new Date(credentials.expiry_date || Date.now() + 3600000),
        metadata: this.config.metadata,
      };
    } catch (error) {
      await this.handleError(error);
      throw error;
    }
  }

  async searchEvents(params: {
    timeMin?: string;
    timeMax?: string;
    query?: string;
    maxResults?: number;
  }) {
    await this.ensureValidToken();

    try {
      const response = await this.calendar.events.list({
        calendarId: "primary",
        timeMin: params.timeMin || new Date().toISOString(),
        timeMax:
          params.timeMax ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        q: params.query,
        maxResults: params.maxResults || 10,
        singleEvents: true,
        orderBy: "startTime",
      });

      return response.data.items || [];
    } catch (error) {
      await this.handleError(error);
      return [];
    }
  }

  async createEvent(params: {
    summary: string;
    description?: string;
    start: string;
    end: string;
    location?: string;
    attendees?: string[];
    reminders?: any;
  }) {
    await this.ensureValidToken();

    const event = {
      summary: params.summary,
      description: params.description,
      location: params.location,
      start: {
        dateTime: params.start,
        timeZone: "UTC",
      },
      end: {
        dateTime: params.end,
        timeZone: "UTC",
      },
      attendees: params.attendees?.map((email) => ({ email })),
      reminders: params.reminders || {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 10 },
        ],
      },
    };

    try {
      const response = await this.calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
        sendUpdates: "all",
      });

      return response.data;
    } catch (error) {
      await this.handleError(error);
      throw error;
    }
  }

  async updateEvent(eventId: string, updates: any) {
    await this.ensureValidToken();

    try {
      const response = await this.calendar.events.patch({
        calendarId: "primary",
        eventId,
        requestBody: updates,
        sendUpdates: "all",
      });

      return response.data;
    } catch (error) {
      await this.handleError(error);
      throw error;
    }
  }

  async deleteEvent(eventId: string) {
    await this.ensureValidToken();

    try {
      await this.calendar.events.delete({
        calendarId: "primary",
        eventId,
        sendUpdates: "all",
      });

      return true;
    } catch (error) {
      await this.handleError(error);
      return false;
    }
  }

  async getEvent(eventId: string) {
    await this.ensureValidToken();

    try {
      const response = await this.calendar.events.get({
        calendarId: "primary",
        eventId,
      });

      return response.data;
    } catch (error) {
      await this.handleError(error);
      return null;
    }
  }

  async getUpcomingEvents(days: number = 7) {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.searchEvents({
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      maxResults: 50,
    });
  }

  async getFreeBusy(timeMin: string, timeMax: string, calendars?: string[]) {
    await this.ensureValidToken();

    const calendarIds = calendars || ["primary"];

    try {
      const response = await this.calendar.freebusy.query({
        requestBody: {
          timeMin,
          timeMax,
          items: calendarIds.map((id) => ({ id })),
        },
      });

      return response.data;
    } catch (error) {
      await this.handleError(error);
      return null;
    }
  }
}
