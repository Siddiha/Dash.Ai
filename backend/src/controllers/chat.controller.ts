
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

  static async deleteChatSession(req: any, res: Response) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;

      const session = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
      });

      if (!session) {
        return res.status(404).json({ error: "Chat session not found" });
      }

      await prisma.chatSession.delete({
        where: { id: sessionId },
      });

      res.json({ message: "Chat session deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete chat session" });
    }
  }
}



