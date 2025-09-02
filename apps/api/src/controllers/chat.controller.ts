import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import ChatService from '../services/ai/chat.service';

const sendMessageSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
});

class ChatController {
  async sendMessage(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { message, conversationId } = sendMessageSchema.parse(req.body);

      const result = await ChatService.processMessage(userId, message, conversationId);

      res.json(result);
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to process message' });
    }
  }

  async getConversations(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const conversations = await prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      res.json(conversations);
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  }

  async getConversation(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      const conversation = await prisma.conversation.findUnique({
        where: { id, userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      res.json(conversation);
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  }

  async deleteConversation(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      await prisma.conversation.delete({
        where: { id, userId },
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Delete conversation error:', error);
      res.status(500).json({ error: 'Failed to delete conversation' });
    }
  }

  async getMessages(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const conversation = await prisma.conversation.findUnique({
        where: { id, userId },
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const messages = await prisma.message.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: 'asc' },
        take: Number(limit),
        skip: Number(offset),
      });

      res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }
}

export default new ChatController();