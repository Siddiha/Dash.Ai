import { Client } from "@notionhq/client";
import { BaseIntegration, IntegrationConfig } from "./base-integration";

export class NotionService extends BaseIntegration {
  private notion: Client;

  constructor(config: IntegrationConfig) {
    super(config);
    this.notion = new Client({ auth: this.config.accessToken });
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
    // Notion doesn't have a revoke endpoint
    // Token invalidation happens on their side
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.notion.users.me({});
      return !!response;
    } catch (error) {
      return false;
    }
  }

  async searchPages(query: string) {
    try {
      const response = await this.notion.search({
        query,
        filter: { property: "object", value: "page" },
        sort: { direction: "descending", timestamp: "last_edited_time" },
      });

      return response.results;
    } catch (error) {
      await this.handleError(error);
      return [];
    }
  }

  async createPage(params: {
    title: string;
    content: string;
    parentId?: string;
    databaseId?: string;
    properties?: any;
  }) {
    try {
      const children = this.parseContentToBlocks(params.content);

      let parent: any;
      if (params.databaseId) {
        parent = { database_id: params.databaseId };
      } else if (params.parentId) {
        parent = { page_id: params.parentId };
      } else {
        // Get the first accessible page as parent
        const pages = await this.notion.search({
          filter: { property: "object", value: "page" },
        });
        if (pages.results.length > 0) {
          parent = { page_id: pages.results[0].id };
        } else {
          throw new Error("No parent page available");
        }
      }

      const response = await this.notion.pages.create({
        parent,
        properties: params.properties || {
          title: {
            title: [{ text: { content: params.title } }],
          },
        },
        children,
      });

      return response;
    } catch (error) {
      await this.handleError(error);
      throw error;
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
      await this.handleError(error);
      throw error;
    }
  }

  async getPage(pageId: string) {
    try {
      const page = await this.notion.pages.retrieve({ page_id: pageId });
      const blocks = await this.notion.blocks.children.list({
        block_id: pageId,
      });

      return {
        ...page,
        content: blocks.results,
      };
    } catch (error) {
      await this.handleError(error);
      return null;
    }
  }

  async getDatabases() {
    try {
      const response = await this.notion.search({
        filter: { property: "object", value: "database" },
      });

      return response.results;
    } catch (error) {
      await this.handleError(error);
      return [];
    }
  }

  async queryDatabase(databaseId: string, filter?: any, sorts?: any[]) {
    try {
      const response = await this.notion.databases.query({
        database_id: databaseId,
        filter,
        sorts,
      });

      return response.results;
    } catch (error) {
      await this.handleError(error);
      return [];
    }
  }

  async appendBlocksToPage(pageId: string, content: string) {
    try {
      const children = this.parseContentToBlocks(content);

      const response = await this.notion.blocks.children.append({
        block_id: pageId,
        children,
      });

      return response;
    } catch (error) {
      await this.handleError(error);
      throw error;
    }
  }

  private parseContentToBlocks(content: string): any[] {
    const lines = content.split("\n");
    const blocks: any[] = [];

    for (const line of lines) {
      if (line.startsWith("# ")) {
        blocks.push({
          object: "block",
          type: "heading_1",
          heading_1: {
            rich_text: [{ type: "text", text: { content: line.substring(2) } }],
          },
        });
      } else if (line.startsWith("## ")) {
        blocks.push({
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: line.substring(3) } }],
          },
        });
      } else if (line.startsWith("- ")) {
        blocks.push({
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [{ type: "text", text: { content: line.substring(2) } }],
          },
        });
      } else if (line.startsWith("[ ] ")) {
        blocks.push({
          object: "block",
          type: "to_do",
          to_do: {
            rich_text: [{ type: "text", text: { content: line.substring(4) } }],
            checked: false,
          },
        });
      } else if (line.startsWith("[x] ")) {
        blocks.push({
          object: "block",
          type: "to_do",
          to_do: {
            rich_text: [{ type: "text", text: { content: line.substring(4) } }],
            checked: true,
          },
        });
      } else if (line.trim()) {
        blocks.push({
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: line } }],
          },
        });
      }
    }

    return blocks;
  }
}
