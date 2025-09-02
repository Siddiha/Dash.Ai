import { google } from "googleapis";
import { BaseIntegration, IntegrationConfig } from "./base-integration";

export class GmailService extends BaseIntegration {
  private gmail: any;
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

    this.gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
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
      const response = await this.gmail.users.getProfile({ userId: "me" });
      return !!response.data.emailAddress;
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

  async searchEmails(query: string, maxResults: number = 10) {
    await this.ensureValidToken();

    try {
      const response = await this.gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults,
      });

      if (!response.data.messages) {
        return [];
      }

      const messages = await Promise.all(
        response.data.messages.map(async (msg: any) => {
          const detail = await this.gmail.users.messages.get({
            userId: "me",
            id: msg.id,
          });
          return this.parseEmail(detail.data);
        })
      );

      return messages;
    } catch (error) {
      await this.handleError(error);
      return [];
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    cc?: string[],
    bcc?: string[]
  ) {
    await this.ensureValidToken();

    const message = this.createMessage(to, subject, body, cc, bcc);

    try {
      const response = await this.gmail.users.messages.send({
        userId: "me",
        requestBody: { raw: message },
      });

      return response.data;
    } catch (error) {
      await this.handleError(error);
      throw error;
    }
  }

  async getEmail(messageId: string) {
    await this.ensureValidToken();

    try {
      const response = await this.gmail.users.messages.get({
        userId: "me",
        id: messageId,
      });

      return this.parseEmail(response.data);
    } catch (error) {
      await this.handleError(error);
      return null;
    }
  }

  async createDraft(to: string, subject: string, body: string) {
    await this.ensureValidToken();

    const message = this.createMessage(to, subject, body);

    try {
      const response = await this.gmail.users.drafts.create({
        userId: "me",
        requestBody: {
          message: { raw: message },
        },
      });

      return response.data;
    } catch (error) {
      await this.handleError(error);
      throw error;
    }
  }

  private createMessage(
    to: string,
    subject: string,
    body: string,
    cc?: string[],
    bcc?: string[]
  ) {
    const messageParts = [`To: ${to}`, `Subject: ${subject}`];

    if (cc && cc.length > 0) {
      messageParts.push(`Cc: ${cc.join(", ")}`);
    }

    if (bcc && bcc.length > 0) {
      messageParts.push(`Bcc: ${bcc.join(", ")}`);
    }

    messageParts.push("", body);

    const message = messageParts.join("\n");

    return Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  private parseEmail(message: any) {
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())
        ?.value;

    const body = this.extractBody(message.payload);

    return {
      id: message.id,
      threadId: message.threadId,
      from: getHeader("from"),
      to: getHeader("to"),
      cc: getHeader("cc"),
      subject: getHeader("subject"),
      date: getHeader("date"),
      snippet: message.snippet,
      body,
      attachments: this.extractAttachments(message.payload),
      labels: message.labelIds || [],
    };
  }

  private extractBody(payload: any): string {
    if (!payload) return "";

    if (payload.body?.data) {
      return Buffer.from(payload.body.data, "base64").toString("utf-8");
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
          return Buffer.from(part.body.data, "base64").toString("utf-8");
        }
      }

      for (const part of payload.parts) {
        if (part.mimeType === "text/html" && part.body?.data) {
          return Buffer.from(part.body.data, "base64").toString("utf-8");
        }
      }
    }

    return "";
  }

  private extractAttachments(payload: any): any[] {
    const attachments: any[] = [];

    const processPartForAttachments = (part: any) => {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body.size,
          attachmentId: part.body.attachmentId,
        });
      }

      if (part.parts) {
        part.parts.forEach(processPartForAttachments);
      }
    };

    if (payload?.parts) {
      payload.parts.forEach(processPartForAttachments);
    }

    return attachments;
  }
}
