// backend/src/services/integrations/base.integration.ts
export abstract class BaseIntegration {
  protected accessToken: string;
  protected refreshToken?: string;

  constructor(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  abstract testConnection(): Promise<boolean>;
  abstract refreshAccessToken(): Promise<string>;
}

// backend/src/services/integrations/gmail.service.ts
import { google } from "googleapis";
import { BaseIntegration } from "./base.integration";
import { OAUTH_CONFIG } from "../../config/oauth";

export class GmailService extends BaseIntegration {
  private gmail: any;
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
    this.gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.gmail.users.getProfile({ userId: "me" });
      return true;
    } catch {
      return false;
    }
  }

  async refreshAccessToken(): Promise<string> {
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    this.oauth2Client.setCredentials(credentials);
    return credentials.access_token;
  }

  async getEmails(maxResults: number = 10) {
    try {
      const response = await this.gmail.users.messages.list({
        userId: "me",
        maxResults,
        q: "is:unread",
      });

      const emails = [];
      if (response.data.messages) {
        for (const message of response.data.messages.slice(0, maxResults)) {
          const email = await this.gmail.users.messages.get({
            userId: "me",
            id: message.id,
          });
          emails.push(this.formatEmail(email.data));
        }
      }

      return emails;
    } catch (error) {
      throw new Error(`Failed to get emails: ${error}`);
    }
  }

  async sendEmail(to: string, subject: string, body: string) {
    try {
      const message = [`To: ${to}`, `Subject: ${subject}`, "", body].join("\n");

      const encodedMessage = Buffer.from(message)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const response = await this.gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedMessage,
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to send email: ${error}`);
    }
  }

  private formatEmail(emailData: any) {
    const headers = emailData.payload.headers;
    const getHeader = (name: string) =>
      headers.find((h: any) => h.name === name)?.value;

    return {
      id: emailData.id,
      threadId: emailData.threadId,
      subject: getHeader("Subject"),
      from: getHeader("From"),
      to: getHeader("To"),
      date: getHeader("Date"),
      snippet: emailData.snippet,
      body: this.extractBody(emailData.payload),
    };
  }

  private extractBody(payload: any): string {
    if (payload.body.data) {
      return Buffer.from(payload.body.data, "base64").toString();
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === "text/plain" && part.body.data) {
          return Buffer.from(part.body.data, "base64").toString();
        }
      }
    }

    return "";
  }
}

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

// backend/src/services/integrations/notion.service.ts
import { Client } from "@notionhq/client";
import { BaseIntegration } from "./base.integration";

export class NotionService extends BaseIntegration {
  private notion: Client;

  constructor(accessToken: string) {
    super(accessToken);
    this.notion = new Client({ auth: accessToken });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.notion.users.me();
      return true;
    } catch {
      return false;
    }
  }

  async refreshAccessToken(): Promise<string> {
    // Notion tokens don't expire, return the same token
    return this.accessToken;
  }

  async getDatabases() {
    try {
      const response = await this.notion.search({
        filter: { property: "object", value: "database" },
      });
      return response.results;
    } catch (error) {
      throw new Error(`Failed to get databases: ${error}`);
    }
  }

  async getPages(databaseId?: string) {
    try {
      if (databaseId) {
        const response = await this.notion.databases.query({
          database_id: databaseId,
        });
        return response.results;
      } else {
        const response = await this.notion.search({
          filter: { property: "object", value: "page" },
        });
        return response.results;
      }
    } catch (error) {
      throw new Error(`Failed to get pages: ${error}`);
    }
  }

  async createPage(parentId: string, properties: any, children?: any[]) {
    try {
      const response = await this.notion.pages.create({
        parent: { database_id: parentId },
        properties,
        children,
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to create page: ${error}`);
    }
  }

  async updatePage(pageId: string, properties: any) {
    try {
      const response = await this.notion.pages.update({
        page_id: pageId,
        properties,
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to update page: ${error}`);
    }
  }
}

// backend/src/services/integrations/slack.service.ts
import { WebClient } from "@slack/web-api";
import { BaseIntegration } from "./base.integration";

export class SlackService extends BaseIntegration {
  private slack: WebClient;

  constructor(accessToken: string) {
    super(accessToken);
    this.slack = new WebClient(accessToken);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.slack.auth.test();
      return true;
    } catch {
      return false;
    }
  }

  async refreshAccessToken(): Promise<string> {
    // Slack tokens don't expire, return the same token
    return this.accessToken;
  }

  async getChannels() {
    try {
      const response = await this.slack.conversations.list({
        types: "public_channel,private_channel",
      });
      return response.channels;
    } catch (error) {
      throw new Error(`Failed to get channels: ${error}`);
    }
  }

  async sendMessage(channel: string, text: string, blocks?: any[]) {
    try {
      const response = await this.slack.chat.postMessage({
        channel,
        text,
        blocks,
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to send message: ${error}`);
    }
  }

  async getMessages(channel: string, limit: number = 10) {
    try {
      const response = await this.slack.conversations.history({
        channel,
        limit,
      });
      return response.messages;
    } catch (error) {
      throw new Error(`Failed to get messages: ${error}`);
    }
  }

  async getUser(userId: string) {
    try {
      const response = await this.slack.users.info({ user: userId });
      return response.user;
    } catch (error) {
      throw new Error(`Failed to get user: ${error}`);
    }
  }
}
