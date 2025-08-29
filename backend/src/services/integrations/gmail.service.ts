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


