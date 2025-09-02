import OpenAI from "openai";
import { prisma } from "../../index";
import { GmailService } from "../integrations/gmail.service";
import { CalendarService } from "../integrations/calendar.service";
import { NotionService } from "../integrations/notion.service";

export class ChatService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }

  async processMessage(
    userId: string,
    message: string,
    conversationId?: string
  ) {
    try {
      // Get or create conversation
      let conversation;
      if (conversationId) {
        conversation = await prisma.conversation.findUnique({
          where: { id: conversationId, userId },
          include: { messages: { orderBy: { createdAt: "asc" } } },
        });
      }

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { userId, title: message.slice(0, 50) },
          include: { messages: true },
        });
      }

      // Save user message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "user",
          content: message,
        },
      });

      // Get user's integrations
      const integrations = await prisma.integration.findMany({
        where: { userId, isActive: true },
      });

      // Prepare tools based on active integrations
      const tools = this.prepareTools(integrations);

      // Prepare messages history
      const messages = [
        {
          role: "system" as const,
          content: `You are an AI work assistant that helps users manage their tasks, calendar, emails, and documents. 
                   You have access to their connected tools and can perform actions on their behalf.
                   Current date: ${new Date().toISOString()}
                   User's active integrations: ${integrations
                     .map((i) => i.type)
                     .join(", ")}`,
        },
        ...conversation.messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content: message },
      ];

      // Get AI response with tools
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? "auto" : undefined,
      });

      const responseMessage = completion.choices[0].message;
      let finalResponse = responseMessage.content;
      let actions = null;

      // Handle tool calls
      if (responseMessage.tool_calls) {
        const toolResults = await this.executeTools(
          responseMessage.tool_calls,
          userId,
          integrations
        );

        // Get final response after tool execution
        const finalCompletion = await this.openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            ...messages,
            responseMessage,
            ...toolResults.map((result) => ({
              role: "tool" as const,
              tool_call_id: result.tool_call_id,
              content: JSON.stringify(result.content),
            })),
          ],
        });

        finalResponse = finalCompletion.choices[0].message.content;
        actions = responseMessage.tool_calls;
      }

      // Save assistant message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: finalResponse || "",
          metadata: actions ? { actions } : undefined,
        },
      });

      return {
        message: finalResponse,
        conversationId: conversation.id,
        actions,
      };
    } catch (error) {
      console.error("Chat processing error:", error);
      throw error;
    }
  }

  private prepareTools(integrations: any[]) {
    const tools = [] as any[];

    if (integrations.some((i) => i.type === "gmail")) {
      tools.push(
        {
          type: "function" as const,
          function: {
            name: "search_emails",
            description: "Search for emails in Gmail",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string", description: "Search query" },
                limit: {
                  type: "number",
                  description: "Maximum number of results",
                },
              },
              required: ["query"],
            },
          },
        },
        {
          type: "function" as const,
          function: {
            name: "send_email",
            description: "Send an email via Gmail",
            parameters: {
              type: "object",
              properties: {
                to: { type: "string", description: "Recipient email" },
                subject: { type: "string", description: "Email subject" },
                body: { type: "string", description: "Email body" },
              },
              required: ["to", "subject", "body"],
            },
          },
        }
      );
    }

    if (integrations.some((i) => i.type === "calendar")) {
      tools.push(
        {
          type: "function" as const,
          function: {
            name: "search_calendar",
            description: "Search for events in Google Calendar",
            parameters: {
              type: "object",
              properties: {
                timeMin: {
                  type: "string",
                  description: "Start time (ISO format)",
                },
                timeMax: {
                  type: "string",
                  description: "End time (ISO format)",
                },
                query: { type: "string", description: "Search query" },
              },
            },
          },
        },
        {
          type: "function" as const,
          function: {
            name: "create_event",
            description: "Create a calendar event",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "Event title" },
                description: {
                  type: "string",
                  description: "Event description",
                },
                start: {
                  type: "string",
                  description: "Start time (ISO format)",
                },
                end: { type: "string", description: "End time (ISO format)" },
                attendees: {
                  type: "array",
                  items: { type: "string" },
                  description: "Email addresses of attendees",
                },
              },
              required: ["summary", "start", "end"],
            },
          },
        }
      );
    }

    if (integrations.some((i) => i.type === "notion")) {
      tools.push({
        type: "function" as const,
        function: {
          name: "create_notion_page",
          description: "Create a page in Notion",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Page title" },
              content: { type: "string", description: "Page content" },
              database_id: {
                type: "string",
                description: "Database ID (optional)",
              },
            },
            required: ["title", "content"],
          },
        },
      });
    }

    return tools;
  }

  private async executeTools(
    toolCalls: any[],
    userId: string,
    integrations: any[]
  ) {
    const results = [] as any[];

    for (const toolCall of toolCalls) {
      const args = JSON.parse(toolCall.function.arguments);
      let result: any = { error: "Tool not implemented" };

      try {
        switch (toolCall.function.name) {
          case "search_emails": {
            const gmailIntegration = integrations.find(
              (i) => i.type === "gmail"
            );
            if (gmailIntegration) {
              const gmailService = new GmailService(gmailIntegration);
              result = await gmailService.searchEmails(args.query, args.limit);
            }
            break;
          }
          case "send_email": {
            const gmailIntegration = integrations.find(
              (i) => i.type === "gmail"
            );
            if (gmailIntegration) {
              const gmailService = new GmailService(gmailIntegration);
              result = await gmailService.sendEmail(
                args.to,
                args.subject,
                args.body
              );
            }
            break;
          }
          case "search_calendar": {
            const calendarIntegration = integrations.find(
              (i) => i.type === "calendar"
            );
            if (calendarIntegration) {
              const calendarService = new CalendarService(calendarIntegration);
              result = await calendarService.searchEvents(args);
            }
            break;
          }
          case "create_event": {
            const calendarIntegration = integrations.find(
              (i) => i.type === "calendar"
            );
            if (calendarIntegration) {
              const calendarService = new CalendarService(calendarIntegration);
              result = await calendarService.createEvent(args);
            }
            break;
          }
          case "create_notion_page": {
            const notionIntegration = integrations.find(
              (i) => i.type === "notion"
            );
            if (notionIntegration) {
              const notionService = new NotionService(notionIntegration);
              result = await notionService.createPage(args);
            }
            break;
          }
        }
      } catch (error: any) {
        console.error(
          `Tool execution error for ${toolCall.function.name}:`,
          error
        );
        result = { error: error.message };
      }

      results.push({
        tool_call_id: toolCall.id,
        content: result,
      });
    }

    return results;
  }
}

export default new ChatService();
