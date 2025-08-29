

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


