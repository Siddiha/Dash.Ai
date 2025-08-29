// backend/src/services/ai/openai.service.ts
import OpenAI from "openai";
import { AI_CONFIG } from "../../config/ai";

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: AI_CONFIG.openai.apiKey,
    });
  }

  async generateResponse(
    messages: Array<{ role: string; content: string }>,
    context?: any
  ) {
    try {
      const systemPrompt = this.buildSystemPrompt(context);

      const completion = await this.openai.chat.completions.create({
        model: AI_CONFIG.openai.model,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: AI_CONFIG.openai.maxTokens,
        temperature: AI_CONFIG.openai.temperature,
        functions: this.getFunctions(),
        function_call: "auto",
      });

      return completion.choices[0].message;
    } catch (error) {
      throw new Error(`OpenAI API error: ${error}`);
    }
  }

  private buildSystemPrompt(context?: any): string {
    let prompt = `You are Dash.AI, an intelligent assistant that can help users manage their work across multiple platforms. You have access to:

- Gmail: Read, send, and organize emails
- Google Calendar: Schedule, update, and manage events  
- Notion: Create, update pages and databases
- Slack: Send messages and manage communications
- HubSpot: Manage contacts, deals, and sales tasks
- Linear: Create and update project tasks

Current capabilities:
- Analyze emails and suggest actions
- Schedule meetings and events
- Create tasks and reminders
- Send messages and notifications
- Generate reports and summaries
- Automate workflows between platforms

Guidelines:
- Always confirm actions before executing them
- Provide clear, actionable suggestions
- Ask for clarification when needed
- Be proactive in suggesting optimizations
- Maintain professional tone
- Respect privacy and security`;

    if (context) {
      prompt += `\n\nCurrent context:\n${JSON.stringify(context, null, 2)}`;
    }

    return prompt;
  }

  private getFunctions() {
    return [
      {
        name: "send_email",
        description: "Send an email through Gmail",
        parameters: {
          type: "object",
          properties: {
            to: { type: "string", description: "Recipient email address" },
            subject: { type: "string", description: "Email subject" },
            body: { type: "string", description: "Email body content" },
          },
          required: ["to", "subject", "body"],
        },
      },
      {
        name: "create_calendar_event",
        description: "Create a new calendar event",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "string", description: "Event title" },
            description: { type: "string", description: "Event description" },
            start: { type: "string", description: "Start time (ISO format)" },
            end: { type: "string", description: "End time (ISO format)" },
            attendees: {
              type: "array",
              items: { type: "string" },
              description: "List of attendee email addresses",
            },
          },
          required: ["summary", "start", "end"],
        },
      },
      {
        name: "create_notion_page",
        description: "Create a new page in Notion",
        parameters: {
          type: "object",
          properties: {
            databaseId: {
              type: "string",
              description: "Database ID to create page in",
            },
            title: { type: "string", description: "Page title" },
            properties: { type: "object", description: "Page properties" },
          },
          required: ["databaseId", "title"],
        },
      },
      {
        name: "send_slack_message",
        description: "Send a message to Slack",
        parameters: {
          type: "object",
          properties: {
            channel: { type: "string", description: "Channel ID or name" },
            message: { type: "string", description: "Message content" },
          },
          required: ["channel", "message"],
        },
      },
      {
        name: "create_task",
        description: "Create a new task",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Task title" },
            description: { type: "string", description: "Task description" },
            priority: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
              description: "Task priority",
            },
            dueDate: { type: "string", description: "Due date (ISO format)" },
          },
          required: ["title"],
        },
      },
      {
        name: "analyze_data",
        description: "Analyze data from connected integrations",
        parameters: {
          type: "object",
          properties: {
            source: {
              type: "string",
              enum: ["email", "calendar", "notion", "slack", "tasks"],
              description: "Data source to analyze",
            },
            timeframe: {
              type: "string",
              description:
                'Time frame for analysis (e.g., "last week", "this month")',
            },
            metrics: {
              type: "array",
              items: { type: "string" },
              description: "Specific metrics to analyze",
            },
          },
          required: ["source"],
        },
      },
    ];
  }
}

