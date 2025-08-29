// backend/src/utils/validators.ts
import Joi from "joi";

export const validateEmail = (email: string): boolean => {
  const schema = Joi.string().email();
  const { error } = schema.validate(email);
  return !error;
};

export const validateUrl = (url: string): boolean => {
  const schema = Joi.string().uri();
  const { error } = schema.validate(url);
  return !error;
};

export const sanitizeInput = (input: string): string => {
  return input.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );
};
