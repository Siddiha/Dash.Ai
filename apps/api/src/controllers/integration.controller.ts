import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { google } from "googleapis";

const connectSchema = z.object({
  type: z.string(),
  credentials: z.any(),
});

class IntegrationController {
  async getIntegrations(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const integrations = await prisma.integration.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          isActive: true,
          createdAt: true,
          metadata: true,
        },
      });

      res.json(integrations);
    } catch (error) {
      console.error("Get integrations error:", error);
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  }

  async connect(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { type, credentials } = connectSchema.parse(req.body);

      const integration = await prisma.integration.upsert({
        where: {
          userId_type: { userId, type },
        },
        update: {
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          expiresAt: credentials.expiresAt,
          isActive: true,
          metadata: credentials.metadata,
        },
        create: {
          userId,
          type,
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          expiresAt: credentials.expiresAt,
          metadata: credentials.metadata,
        },
      });

      res.json(integration);
    } catch (error) {
      console.error("Connect integration error:", error);
      res.status(500).json({ error: "Failed to connect integration" });
    }
  }

  async disconnect(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { type } = req.params;

      await prisma.integration.update({
        where: {
          userId_type: { userId, type },
        },
        data: {
          isActive: false,
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Disconnect integration error:", error);
      res.status(500).json({ error: "Failed to disconnect integration" });
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { type } = req.params;

      const integration = await prisma.integration.findUnique({
        where: {
          userId_type: { userId, type },
        },
      });

      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      // Refresh logic based on integration type
      // This is a placeholder - implement actual refresh logic

      res.json({ success: true });
    } catch (error) {
      console.error("Refresh integration error:", error);
      res.status(500).json({ error: "Failed to refresh integration" });
    }
  }

  async test(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { type } = req.params;

      const integration = await prisma.integration.findUnique({
        where: {
          userId_type: { userId, type },
        },
      });

      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      // Test connection based on integration type
      // This is a placeholder - implement actual test logic

      res.json({ connected: true });
    } catch (error) {
      console.error("Test integration error:", error);
      res.status(500).json({ error: "Failed to test integration" });
    }
  }

  async googleOAuth(req: Request, res: Response) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.BACKEND_URL}/api/integrations/oauth/google/callback`
    );

    const scopes = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/drive.file",
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
      state: req.query.state || "",
    });

    res.redirect(url);
  }

  async googleOAuthCallback(req: Request, res: Response) {
    try {
      const { code, state } = req.query;

      if (!code) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/integrations?error=no_code`
        );
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.BACKEND_URL}/api/integrations/oauth/google/callback`
      );

      const { tokens } = await oauth2Client.getToken(code as string);

      // Decode state to retrieve token and service
      let userId: string | null = null;
      let service: string | null = null;
      try {
        if (state) {
          const parsed = JSON.parse(
            Buffer.from(String(state), "base64").toString("utf8")
          );
          const jwt = require("jsonwebtoken");
          const decoded = jwt.verify(
            parsed.token,
            process.env.JWT_SECRET!
          ) as any;
          userId = decoded.userId;
          service = parsed.service;
        }
      } catch {}

      if (!userId) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/integrations?error=unauthorized`
        );
      }

      await prisma.integration.upsert({
        where: { userId_type: { userId, type: service || "gmail" } },
        update: {
          accessToken: tokens.access_token || null,
          refreshToken: tokens.refresh_token || null,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          isActive: true,
          metadata: tokens,
        },
        create: {
          userId,
          type: service || "gmail",
          accessToken: tokens.access_token || null,
          refreshToken: tokens.refresh_token || null,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          isActive: true,
          metadata: tokens,
        },
      });

      res.redirect(
        `${process.env.FRONTEND_URL}/integrations?success=true&service=${
          service || ""
        }`
      );
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect(
        `${process.env.FRONTEND_URL}/integrations?error=oauth_failed`
      );
    }
  }

  async slackOAuth(req: Request, res: Response) {
    const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=chat:write,channels:read,users:read&redirect_uri=${process.env.BACKEND_URL}/api/integrations/oauth/slack/callback`;
    res.redirect(slackAuthUrl);
  }

  async slackOAuthCallback(req: Request, res: Response) {
    try {
      const { code } = req.query;

      if (!code) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/integrations?error=no_code`
        );
      }

      // Exchange code for token
      const response = await fetch("https://slack.com/api/oauth.v2.access", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.SLACK_CLIENT_ID!,
          client_secret: process.env.SLACK_CLIENT_SECRET!,
          code: code as string,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error("Slack OAuth failed");
      }

      // Store token in database
      // This is a placeholder - need to identify user from session/state

      res.redirect(`${process.env.FRONTEND_URL}/integrations?success=true`);
    } catch (error) {
      console.error("Slack OAuth callback error:", error);
      res.redirect(
        `${process.env.FRONTEND_URL}/integrations?error=oauth_failed`
      );
    }
  }
}

export default new IntegrationController();
