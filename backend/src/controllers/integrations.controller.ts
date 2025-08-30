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
      await service.testConnection();

      return res.json({ message: "Integration synced successfully" });
    } catch (error) {
      return res.status(500).json({ error: "Failed to sync integration" });
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

      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: "Failed to get integration data" });
    }
  }
}



