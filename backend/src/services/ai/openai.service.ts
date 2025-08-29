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

// backend/src/services/ai/langchain.service.ts
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { PromptTemplate } from "langchain/prompts";

export class LangChainService {
  private model: ChatOpenAI;
  private memory: BufferMemory;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    this.memory = new BufferMemory({
      memoryKey: "history",
    });
  }

  async processConversation(input: string, context?: any): Promise<string> {
    const prompt = PromptTemplate.fromTemplate(`
      You are Dash.AI, a helpful assistant that manages tasks across multiple platforms.
      
      Current context: {context}
      
      Conversation history:
      {history}
      
      Human: {input}
      Assistant:
    `);

    const chain = new ConversationChain({
      llm: this.model,
      memory: this.memory,
      prompt,
    });

    const response = await chain.call({
      input,
      context: context ? JSON.stringify(context) : "No additional context",
    });

    return response.response;
  }

  async extractActionItems(text: string): Promise<string[]> {
    const prompt = `Extract action items from the following text. Return them as a JSON array of strings:

    Text: ${text}
    
    Action items:`;

    const response = await this.model.call([{ role: "user", content: prompt }]);

    try {
      return JSON.parse(response.content);
    } catch {
      return [response.content];
    }
  }

  async categorizeContent(
    content: string,
    categories: string[]
  ): Promise<string> {
    const prompt = `Categorize the following content into one of these categories: ${categories.join(
      ", "
    )}

    Content: ${content}
    
    Category:`;

    const response = await this.model.call([{ role: "user", content: prompt }]);
    return response.content.trim();
  }

  async generateSummary(
    content: string,
    maxLength: number = 150
  ): Promise<string> {
    const prompt = `Summarize the following content in ${maxLength} characters or less:

    Content: ${content}
    
    Summary:`;

    const response = await this.model.call([{ role: "user", content: prompt }]);
    return response.content;
  }
}

// backend/src/controllers/chat.controller.ts
import { Request, Response } from "express";
import { OpenAIService } from "../services/ai/openai.service";
import { LangChainService } from "../services/ai/langchain.service";
import { prisma } from "../config/database";
import { IntegrationService } from "../services/integrations.service";

export class ChatController {
  static async sendMessage(req: any, res: Response) {
    try {
      const { message, sessionId } = req.body;
      const userId = req.user.id;

      // Get or create chat session
      let session;
      if (sessionId) {
        session = await prisma.chatSession.findFirst({
          where: { id: sessionId, userId },
          include: { messages: { orderBy: { createdAt: "asc" } } },
        });
      }

      if (!session) {
        session = await prisma.chatSession.create({
          data: {
            userId,
            title:
              message.substring(0, 50) + (message.length > 50 ? "..." : ""),
          },
          include: { messages: true },
        });
      }

      // Save user message
      await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: "USER",
          content: message,
        },
      });

      // Get user's integrations for context
      const integrations = await prisma.integration.findMany({
        where: { userId, isConnected: true },
      });

      // Build context from integrations
      const context = await ChatController.buildContext(userId, integrations);

      // Generate AI response
      const openai = new OpenAIService();
      const conversationHistory = session.messages.map((msg) => ({
        role: msg.role.toLowerCase(),
        content: msg.content,
      }));

      conversationHistory.push({ role: "user", content: message });

      const aiResponse = await openai.generateResponse(
        conversationHistory,
        context
      );

      // Handle function calls
      let finalResponse = aiResponse.content;
      if (aiResponse.function_call) {
        const functionResult = await ChatController.executeFunctionCall(
          aiResponse.function_call,
          userId
        );
        finalResponse = `${aiResponse.content}\n\n${functionResult}`;
      }

      // Save AI response
      const aiMessage = await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: "ASSISTANT",
          content: finalResponse,
          metadata: aiResponse.function_call
            ? { function_call: aiResponse.function_call }
            : null,
        },
      });

      res.json({
        message: aiMessage,
        sessionId: session.id,
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  }

  static async buildContext(userId: string, integrations: any[]) {
    const context: any = {
      integrations: integrations.map((i) => i.type),
      recentTasks: [],
      upcomingEvents: [],
      unreadEmails: 0,
    };

    try {
      // Get recent tasks
      const tasks = await prisma.task.findMany({
        where: { userId, status: { in: ["PENDING", "IN_PROGRESS"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
      context.recentTasks = tasks.map((t) => ({
        title: t.title,
        priority: t.priority,
      }));

      // Get integration-specific context
      for (const integration of integrations) {
        const service = new IntegrationService(integration);

        switch (integration.type) {
          case "GMAIL":
            try {
              const emails = await service.getRecentData();
              context.unreadEmails = emails.length;
            } catch (error) {
              console.error("Failed to get Gmail context:", error);
            }
            break;

          case "GOOGLE_CALENDAR":
            try {
              const events = await service.getRecentData();
              context.upcomingEvents = events.slice(0, 3).map((e: any) => ({
                title: e.summary,
                start: e.start,
              }));
            } catch (error) {
              console.error("Failed to get Calendar context:", error);
            }
            break;
        }
      }
    } catch (error) {
      console.error("Failed to build context:", error);
    }

    return context;
  }

  static async executeFunctionCall(functionCall: any, userId: string) {
    const { name, arguments: args } = functionCall;
    const parsedArgs = typeof args === "string" ? JSON.parse(args) : args;

    try {
      switch (name) {
        case "send_email":
          return await ChatController.handleSendEmail(parsedArgs, userId);
        case "create_calendar_event":
          return await ChatController.handleCreateEvent(parsedArgs, userId);
        case "create_notion_page":
          return await ChatController.handleCreateNotionPage(
            parsedArgs,
            userId
          );
        case "send_slack_message":
          return await ChatController.handleSendSlackMessage(
            parsedArgs,
            userId
          );
        case "create_task":
          return await ChatController.handleCreateTask(parsedArgs, userId);
        default:
          return `Function ${name} not implemented yet.`;
      }
    } catch (error) {
      return `Failed to execute ${name}: ${error}`;
    }
  }

  static async handleSendEmail(args: any, userId: string) {
    const integration = await prisma.integration.findFirst({
      where: { userId, type: "GMAIL", isConnected: true },
    });

    if (!integration) {
      return "Gmail integration not connected. Please connect Gmail first.";
    }

    const service = new IntegrationService(integration);
    await service.executeAction("sendEmail", args);

    return `Email sent successfully to ${args.to}`;
  }

  static async handleCreateEvent(args: any, userId: string) {
    const integration = await prisma.integration.findFirst({
      where: { userId, type: "GOOGLE_CALENDAR", isConnected: true },
    });

    if (!integration) {
      return "Google Calendar integration not connected. Please connect Google Calendar first.";
    }

    const service = new IntegrationService(integration);
    await service.executeAction("createEvent", args);

    return `Calendar event "${args.summary}" created successfully`;
  }

  static async handleCreateTask(args: any, userId: string) {
    const task = await prisma.task.create({
      data: {
        userId,
        title: args.title,
        description: args.description,
        priority: args.priority || "MEDIUM",
        dueDate: args.dueDate ? new Date(args.dueDate) : null,
      },
    });

    return `Task "${task.title}" created successfully`;
  }

  static async handleCreateNotionPage(args: any, userId: string) {
    const integration = await prisma.integration.findFirst({
      where: { userId, type: "NOTION", isConnected: true },
    });

    if (!integration) {
      return "Notion integration not connected. Please connect Notion first.";
    }

    const service = new IntegrationService(integration);
    await service.executeAction("createPage", args);

    return `Notion page "${args.title}" created successfully`;
  }

  static async handleSendSlackMessage(args: any, userId: string) {
    const integration = await prisma.integration.findFirst({
      where: { userId, type: "SLACK", isConnected: true },
    });

    if (!integration) {
      return "Slack integration not connected. Please connect Slack first.";
    }

    const service = new IntegrationService(integration);
    await service.executeAction("sendMessage", args);

    return `Slack message sent to ${args.channel}`;
  }

  static async getChatHistory(req: any, res: Response) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;

      const session = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to get chat history" });
    }
  }

  static async getChatSessions(req: any, res: Response) {
    try {
      const userId = req.user.id;

      const sessions = await prisma.chatSession.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get chat sessions" });
    }
  }
}
