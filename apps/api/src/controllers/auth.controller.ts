import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../index";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class AuthController {
  async signup(req: Request, res: Response) {
    try {
      const { email, password, name } = signupSchema.parse(req.body);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      // Generate token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      res.status(201).json({ user, token });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ error: "Invalid input" });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Invalid input" });
    }
  }

  async me(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          integrations: {
            select: {
              type: true,
              isActive: true,
            },
          },
        },
      });

      res.json(user);
    } catch (error) {
      console.error("Me error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async logout(req: Request, res: Response) {
    // Stateless JWT logout: handled on client by discarding token
    return res.status(200).json({ success: true });
  }

  async refresh(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const email = (req as any).email;

      if (!userId || !email) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = jwt.sign({ userId, email }, process.env.JWT_SECRET!, {
        expiresIn: "7d",
      });

      return res.json({ token });
    } catch (error) {
      console.error("Refresh error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default new AuthController();
