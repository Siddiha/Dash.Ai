import { WebClient } from "@slack/web-api";
import { BaseIntegration, IntegrationConfig } from "./base-integration";

export class SlackService extends BaseIntegration {
  private slack: WebClient;

  constructor(config: IntegrationConfig) {
    super(config);
    this.slack = new WebClient(this.config.accessToken);
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
    try {
      await this.slack.auth.revoke();
    } catch (error) {
      await this.handleError(error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.slack.auth.test();
      return response.ok || false;
    } catch (error) {
      return false;
    }
  }

  async sendMessage(
    channel: string,
    text: string,
    options?: {
      blocks?: any[];
      attachments?: any[];
      thread_ts?: string;
    }
  ) {
    try {
      const response = await this.slack.chat.postMessage({
        channel,
        text,
        blocks: options?.blocks,
        attachments: options?.attachments,
        thread_ts: options?.thread_ts,
      });

      return response;
    } catch (error) {
      await this.handleError(error);
      throw error;
    }
  }

  async getChannels() {
    try {
      const response = await this.slack.conversations.list({
        types: "public_channel,private_channel",
        exclude_archived: true,
      });

      return response.channels || [];
    } catch (error) {
      await this.handleError(error);
      return [];
    }
  }

  async getUsers() {
    try {
      const response = await this.slack.users.list();
      return response.members || [];
    } catch (error) {
      await this.handleError(error);
      return [];
    }
  }

  async searchMessages(query: string) {
    try {
      const response = await this.slack.search.messages({
        query,
        sort: "timestamp",
        sort_dir: "desc",
      });

      return response.messages || { matches: [] };
    } catch (error) {
      await this.handleError(error);
      return { matches: [] };
    }
  }

  async createChannel(name: string, isPrivate: boolean = false) {
    try {
      const response = await this.slack.conversations.create({
        name,
        is_private: isPrivate,
      });

      return response.channel;
    } catch (error) {
      await this.handleError(error);
      throw error;
    }
  }

  async inviteToChannel(channel: string, users: string[]) {
    try {
      const response = await this.slack.conversations.invite({
        channel,
        users: users.join(","),
      });

      return response;
    } catch (error) {
      await this.handleError(error);
      throw error;
    }
  }

  async uploadFile(
    channels: string,
    file: Buffer,
    filename: string,
    title?: string
  ) {
    try {
      const response = await this.slack.files.upload({
        channels,
        file,
        filename,
        title,
      });

      return response.file;
    } catch (error) {
      await this.handleError(error);
      throw error;
    }
  }

  async setStatus(text: string, emoji: string, expiration?: number) {
    try {
      const response = await this.slack.users.profile.set({
        profile: {
          status_text: text,
          status_emoji: emoji,
          status_expiration: expiration,
        },
      });

      return response;
    } catch (error) {
      await this.handleError(error);
      throw error;
    }
  }
}
