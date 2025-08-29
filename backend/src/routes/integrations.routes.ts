// backend/src/routes/integrations.routes.ts
import { Router } from "express";
import { IntegrationController } from "../controllers/integrations.controller";

const router = Router();

router.get("/", IntegrationController.getUserIntegrations);
router.post("/:type/connect", IntegrationController.connectIntegration);
router.delete("/:id", IntegrationController.disconnectIntegration);
router.post("/:id/sync", IntegrationController.syncIntegration);
router.get("/:id/data", IntegrationController.getIntegrationData);

export default router;



// backend/src/controllers/integrations.controller.ts
import { Request, Response } from "express";
import { prisma } from "../config/database";
import { IntegrationService } from "../services/integrations.service";
import { google } from "googleapis";
import { OAUTH_CONFIG } from "../config/oauth";

export class IntegrationController {
  static async getUserIntegrations(req: any, res: Response) {
    try {
      const userId = req.user.id;

      const integrations = await prisma.integration.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          name: true,
          isConnected: true,
          lastSync: true,
          createdAt: true,
        },
      });

      res.json(integrations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get integrations" });
    }
  }

  static async connectIntegration(req: any, res: Response) {
    try {
      const { type } = req.params;
      const userId = req.user.id;

      switch (type) {
        case "GMAIL":
        case "GOOGLE_CALENDAR":
          const oauth2Client = new google.auth.OAuth2(
            OAUTH_CONFIG.google.clientId,
            OAUTH_CONFIG.google.clientSecret,
            OAUTH_CONFIG.google.redirectUri
          );

          const authUrl = oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: OAUTH_CONFIG.google.scopes,
            prompt: "consent",
            state: JSON.stringify({ userId, type }),
          });

          res.json({ authUrl });
          break;

        case "NOTION":
          const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${
            OAUTH_CONFIG.notion.clientId
          }&response_type=code&owner=user&redirect_uri=${encodeURIComponent(
            OAUTH_CONFIG.notion.redirectUri
          )}&state=${JSON.stringify({ userId, type })}`;
          res.json({ authUrl: notionAuthUrl });
          break;

        case "SLACK":
          const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${
            OAUTH_CONFIG.slack.clientId
          }&scope=chat:write,channels:read,users:read&redirect_uri=${encodeURIComponent(
            OAUTH_CONFIG.slack.redirectUri
          )}&state=${JSON.stringify({ userId, type })}`;
          res.json({ authUrl: slackAuthUrl });
          break;

        default:
          res.status(400).json({ error: "Unsupported integration type" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to connect integration" });
    }
  }

  static async disconnectIntegration(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await prisma.integration.deleteMany({
        where: { id, userId },
      });

      res.json({ message: "Integration disconnected successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to disconnect integration" });
    }
  }

  static async syncIntegration(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const integration = await prisma.integration.findFirst({
        where: { id, userId },
      });

      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      const service = new IntegrationService(integration);
      await service.sync();

      await prisma.integration.update({
        where: { id },
        data: { lastSync: new Date() },
      });

      res.json({ message: "Integration synced successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to sync integration" });
    }
  }

  static async getIntegrationData(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const integration = await prisma.integration.findFirst({
        where: { id, userId },
      });

      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      const service = new IntegrationService(integration);
      const data = await service.getRecentData();

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to get integration data" });
    }
  }
}




// backend/src/services/integrations.service.ts
import { Integration } from "@prisma/client";
import { GmailService } from "./integrations/gmail.service";
import { CalendarService } from "./integrations/calendar.service";
import { NotionService } from "./integrations/notion.service";
import { SlackService } from "./integrations/slack.service";

export class IntegrationService {
  private service: any;

  constructor(integration: Integration) {
    switch (integration.type) {
      case "GMAIL":
        this.service = new GmailService(
          integration.accessToken!,
          integration.refreshToken!
        );
        break;
      case "GOOGLE_CALENDAR":
        this.service = new CalendarService(
          integration.accessToken!,
          integration.refreshToken!
        );
        break;
      case "NOTION":
        this.service = new NotionService(integration.accessToken!);
        break;
      case "SLACK":
        this.service = new SlackService(integration.accessToken!);
        break;
      default:
        throw new Error(`Unsupported integration type: ${integration.type}`);
    }
  }

  async testConnection(): Promise<boolean> {
    return this.service.testConnection();
  }

  async sync(): Promise<void> {
    // Implement sync logic based on integration type
    console.log("Syncing integration...");
  }

  async getRecentData(): Promise<any> {
    switch (this.service.constructor.name) {
      case "GmailService":
        return this.service.getEmails(10);
      case "CalendarService":
        return this.service.getEvents();
      case "NotionService":
        return this.service.getPages();
      case "SlackService":
        return this.service.getChannels();
      default:
        return [];
    }
  }

  async executeAction(action: string, params: any): Promise<any> {
    switch (action) {
      case "sendEmail":
        return this.service.sendEmail(params.to, params.subject, params.body);
      case "createEvent":
        return this.service.createEvent(params);
      case "createPage":
        return this.service.createPage(params.parentId, params.properties);
      case "sendMessage":
        return this.service.sendMessage(params.channel, params.message);
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }
}

// backend/src/services/workflow/workflow.service.ts
import { Workflow, WorkflowStep } from "@prisma/client";
import { prisma } from "../../config/database";
import { IntegrationService } from "../integrations.service";

export class WorkflowService {
  async executeWorkflow(workflow: any, triggerData: any) {
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    try {
      const logs: any[] = [];

      for (const step of workflow.steps) {
        logs.push(`Executing step: ${step.action}`);

        const integrationService = new IntegrationService(step.integration);
        const result = await integrationService.executeAction(step.action, {
          ...step.parameters,
          ...triggerData,
        });

        logs.push(`Step completed: ${JSON.stringify(result)}`);
      }

      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          logs: logs,
        },
      });

      return { ...execution, status: "COMPLETED", logs };
    } catch (error) {
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });

      throw error;
    }
  }
}







// frontend/src/components/dashboard/IntegrationStatus.tsx
import React from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from "@heroicons/react/outline";

interface IntegrationStatusProps {
  integrations?: {
    connected: number;
    total: number;
    status: Array<{
      type: string;
      name: string;
      isConnected: boolean;
      lastSync: string;
    }>;
  };
}

function IntegrationStatus({ integrations }: IntegrationStatusProps) {
  const getStatusIcon = (isConnected: boolean) => {
    return isConnected ? (
      <CheckCircleIcon className="h-5 w-5 text-green-500" />
    ) : (
      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
    );
  };

  const getIntegrationIcon = (type: string) => {
    const icons: Record<string, string> = {
      GMAIL: "📧",
      GOOGLE_CALENDAR: "📅",
      NOTION: "📝",
      SLACK: "💬",
      HUBSPOT: "🎯",
      LINEAR: "📋",
    };
    return icons[type] || "🔗";
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Integrations</h3>
        {integrations && (
          <p className="text-sm text-gray-500">
            {integrations.connected} of {integrations.total} connected
          </p>
        )}
      </div>

      <div className="divide-y divide-gray-200">
        {integrations?.status?.map((integration) => (
          <div
            key={integration.type}
            className="px-6 py-4 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">
                {getIntegrationIcon(integration.type)}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {integration.name}
                </p>
                {integration.lastSync && (
                  <p className="text-xs text-gray-500">
                    Synced:{" "}
                    {new Date(integration.lastSync).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            {getStatusIcon(integration.isConnected)}
          </div>
        ))}

        {(!integrations?.status || integrations.status.length === 0) && (
          <div className="px-6 py-8 text-center text-gray-500">
            <ClockIcon className="mx-auto h-8 w-8 mb-2" />
            <p className="text-sm">No integrations connected yet</p>
          </div>
        )}
      </div>

      <div className="px-6 py-3 border-t border-gray-200">
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          Manage integrations →
        </button>
      </div>
    </div>
  );
}

export default IntegrationStatus;

