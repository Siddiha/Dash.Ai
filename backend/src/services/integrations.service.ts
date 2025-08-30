// backend/src/services/integrations.service.ts
import { GmailService } from "./integrations/gmail.service";
import { CalendarService } from "./integrations/calendar.service";
import { NotionService } from "./integrations/notion.service";
import { SlackService } from "./integrations/slack.service";
import { HubSpotService } from "./integrations/hubspot.service";

export class IntegrationService {
  private service: any;
  private integration: any;

  constructor(integration: any) {
    this.integration = integration;
    this.service = this.createService(integration.type);
  }

  private createService(type: string) {
    switch (type) {
      case "GMAIL":
        return new GmailService(this.integration);
      case "GOOGLE_CALENDAR":
        return new CalendarService(this.integration);
      case "NOTION":
        return new NotionService(this.integration);
      case "SLACK":
        return new SlackService(this.integration);
      case "HUBSPOT":
        return new HubSpotService(this.integration);
      default:
        throw new Error(`Unsupported integration type: ${type}`);
    }
  }

  async getRecentData() {
    return this.service.getRecentData();
  }

  async executeAction(action: string, params: any) {
    return this.service.executeAction(action, params);
  }

  async testConnection() {
    return this.service.testConnection();
  }
}
