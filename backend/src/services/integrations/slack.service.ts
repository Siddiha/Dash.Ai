





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
