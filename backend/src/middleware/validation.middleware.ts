// backend/src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from "express";
import Joi from "joi";

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((d) => d.message),
      });
    }
    next();
  };
};

// Validation schemas
export const schemas = {
  createWorkflow: Joi.object({
    name: Joi.string().required().min(1).max(100),
    description: Joi.string().max(500),
    trigger: Joi.object().required(),
    steps: Joi.array().items(
      Joi.object({
        integrationId: Joi.string().required(),
        action: Joi.string().required(),
        parameters: Joi.object(),
      })
    ),
  }),

  createTask: Joi.object({
    title: Joi.string().required().min(1).max(200),
    description: Joi.string().max(1000),
    priority: Joi.string().valid("LOW", "MEDIUM", "HIGH", "URGENT"),
    dueDate: Joi.date(),
  }),

  sendMessage: Joi.object({
    message: Joi.string().required().min(1).max(2000),
    sessionId: Joi.string().optional(),
  }),
};
