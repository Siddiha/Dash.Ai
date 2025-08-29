
// backend/src/services/integrations/calendar.service.ts
import { google } from "googleapis";
import { BaseIntegration } from "./base.integration";
import { OAUTH_CONFIG } from "../../config/oauth";

export class CalendarService extends BaseIntegration {
  private calendar: any;
  private oauth2Client: any;

  constructor(accessToken: string, refreshToken?: string) {
    super(accessToken, refreshToken);
    this.oauth2Client = new google.auth.OAuth2(
      OAUTH_CONFIG.google.clientId,
      OAUTH_CONFIG.google.clientSecret
    );
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    this.calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.calendar.calendarList.list();
      return true;
    } catch {
      return false;
    }
  }

  async refreshAccessToken(): Promise<string> {
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return credentials.access_token;
  }

  async getEvents(timeMin?: string, timeMax?: string, maxResults: number = 10) {
    try {
      const response = await this.calendar.events.list({
        calendarId: "primary",
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax,
        maxResults,
        singleEvents: true,
        orderBy: "startTime",
      });

      return response.data.items.map((event: any) => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        location: event.location,
        attendees: event.attendees,
        htmlLink: event.htmlLink,
      }));
    } catch (error) {
      throw new Error(`Failed to get events: ${error}`);
    }
  }

  async createEvent(eventData: {
    summary: string;
    description?: string;
    start: string;
    end: string;
    location?: string;
    attendees?: string[];
  }) {
    try {
      const event = {
        summary: eventData.summary,
        description: eventData.description,
        start: {
          dateTime: eventData.start,
          timeZone: "UTC",
        },
        end: {
          dateTime: eventData.end,
          timeZone: "UTC",
        },
        location: eventData.location,
        attendees: eventData.attendees?.map((email) => ({ email })),
      };

      const response = await this.calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to create event: ${error}`);
    }
  }

  async updateEvent(eventId: string, eventData: any) {
    try {
      const response = await this.calendar.events.update({
        calendarId: "primary",
        eventId,
        requestBody: eventData,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update event: ${error}`);
    }
  }

  async deleteEvent(eventId: string) {
    try {
      await this.calendar.events.delete({
        calendarId: "primary",
        eventId,
      });
      return true;
    } catch (error) {
      throw new Error(`Failed to delete event: ${error}`);
    }
  }
}


