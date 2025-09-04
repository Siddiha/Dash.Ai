import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", error);

  if ((error as any).name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      details: error.message,
    });
  }

  if ((error as any).name === "UnauthorizedError") {
    return res.status(401).json({
      error: "Unauthorized",
      message: error.message,
    });
  }

  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
};

