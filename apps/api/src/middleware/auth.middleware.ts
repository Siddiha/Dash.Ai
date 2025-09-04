import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    (req as any).userId = decoded.userId;
    (req as any).email = decoded.email;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};
