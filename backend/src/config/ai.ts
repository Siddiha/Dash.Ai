// backend/src/config/ai.ts

export const AI_CONFIG = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4",
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || "2000"),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.7"),
  },
  langchain: {
    modelName: process.env.LANGCHAIN_MODEL || "gpt-4",
    temperature: parseFloat(process.env.LANGCHAIN_TEMPERATURE || "0.7"),
    maxTokens: parseInt(process.env.LANGCHAIN_MAX_TOKENS || "2000"),
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    model: process.env.ANTHROPIC_MODEL || "claude-3-sonnet-20240229",
    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || "4000"),
  }
};



