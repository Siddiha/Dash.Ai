// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";

interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// backend/src/services/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";

export class AuthService {
  static generateToken(userId: string): string {
    return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async comparePasswords(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static async createUser(email: string, name: string, avatar?: string) {
    return prisma.user.create({
      data: {
        email,
        name,
        avatar,
      },
    });
  }

  static async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        integrations: true,
      },
    });
  }
}

// backend/src/routes/auth.routes.ts
import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router = Router();

router.post("/google", AuthController.googleAuth);
router.post("/google/callback", AuthController.googleCallback);
router.get("/me", AuthController.getMe);
router.post("/refresh", AuthController.refreshToken);
router.post("/logout", AuthController.logout);

export default router;

// backend/src/controllers/auth.controller.ts
import { Request, Response } from "express";
import { google } from "googleapis";
import { AuthService } from "../services/auth.service";
import { OAUTH_CONFIG } from "../config/oauth";

export class AuthController {
  static async googleAuth(req: Request, res: Response) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        OAUTH_CONFIG.google.clientId,
        OAUTH_CONFIG.google.clientSecret,
        OAUTH_CONFIG.google.redirectUri
      );

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: OAUTH_CONFIG.google.scopes,
        prompt: "consent",
      });

      res.json({ authUrl });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate auth URL" });
    }
  }

  static async googleCallback(req: Request, res: Response) {
    try {
      const { code } = req.body;

      const oauth2Client = new google.auth.OAuth2(
        OAUTH_CONFIG.google.clientId,
        OAUTH_CONFIG.google.clientSecret,
        OAUTH_CONFIG.google.redirectUri
      );

      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const { data } = await oauth2.userinfo.get();

      let user = await AuthService.findUserByEmail(data.email!);

      if (!user) {
        user = await AuthService.createUser(
          data.email!,
          data.name!,
          data.picture
        );
      }

      // Store Google tokens
      await prisma.integration.upsert({
        where: {
          userId_type: {
            userId: user.id,
            type: "GMAIL",
          },
        },
        update: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          isConnected: true,
        },
        create: {
          userId: user.id,
          type: "GMAIL",
          name: "Gmail",
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          isConnected: true,
        },
      });

      // Also create Google Calendar integration
      await prisma.integration.upsert({
        where: {
          userId_type: {
            userId: user.id,
            type: "GOOGLE_CALENDAR",
          },
        },
        update: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          isConnected: true,
        },
        create: {
          userId: user.id,
          type: "GOOGLE_CALENDAR",
          name: "Google Calendar",
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          isConnected: true,
        },
      });

      const token = AuthService.generateToken(user.id);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.error("Google callback error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  }

  static async getMe(req: any, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          integrations: {
            select: {
              id: true,
              type: true,
              name: true,
              isConnected: true,
              createdAt: true,
            },
          },
        },
      });

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      const token = AuthService.generateToken(user.id);
      res.json({ token });
    } catch (error) {
      res.status(401).json({ error: "Invalid refresh token" });
    }
  }

  static async logout(req: Request, res: Response) {
    // In a more complex setup, you'd invalidate the token
    res.json({ message: "Logged out successfully" });
  }
}
