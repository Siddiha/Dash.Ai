// backend/src/jobs/cleanup.job.ts
import cron from "node-cron";
import { prisma } from "../config/database";
import { logger } from "../utils/logger";

export class CleanupJob {
  start() {
    // Run cleanup daily at 2 AM
    cron.schedule("0 2 * * *", async () => {
      await this.cleanup();
    });

    logger.info("Cleanup job scheduler started");
  }

  private async cleanup() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Execute all cleanup operations in parallel
      const [deletedExecutions, deletedLogs, chatCleanupResult] = await Promise.allSettled([
        // Clean old workflow executions
        prisma.workflowExecution.deleteMany({
          where: {
            startedAt: { lt: thirtyDaysAgo },
            status: "COMPLETED",
          },
        }),

        // Clean old logs
        prisma.integrationLog.deleteMany({
          where: {
            createdAt: { lt: sevenDaysAgo },
          },
        }),

        // Clean old chat messages (keep last 100 per session)
        this.cleanupOldChatMessages(),
      ]);

      // Log results
      if (deletedExecutions.status === 'fulfilled') {
        logger.info(`Deleted ${deletedExecutions.value.count} old workflow executions`);
      } else {
        logger.error("Failed to delete workflow executions:", deletedExecutions.reason);
      }

      if (deletedLogs.status === 'fulfilled') {
        logger.info(`Deleted ${deletedLogs.value.count} old integration logs`);
      } else {
        logger.error("Failed to delete integration logs:", deletedLogs.reason);
      }

      if (chatCleanupResult.status === 'fulfilled') {
        logger.info(`Cleaned up chat messages across ${chatCleanupResult.value} sessions`);
      } else {
        logger.error("Failed to cleanup chat messages:", chatCleanupResult.reason);
      }

      logger.info("Cleanup completed successfully");
    } catch (error) {
      logger.error("Error during cleanup:", error);
    }
  }

  private async cleanupOldChatMessages(): Promise<number> {
    try {
      // Find sessions with more than 100 messages
      const sessionsWithExcessMessages = await prisma.chatSession.findMany({
        include: {
          _count: {
            select: {
              messages: true
            }
          }
        },
        having: {
          messages: {
            _count: {
              gt: 100
            }
          }
        }
      });

      let processedSessions = 0;
      
      // Process each session with excess messages
      for (const session of sessionsWithExcessMessages) {
        // Get IDs of messages to keep (most recent 100)
        const messagesToKeep = await prisma.chatMessage.findMany({
          where: { sessionId: session.id },
          orderBy: { createdAt: "desc" },
          take: 100,
          select: { id: true }
        });

        const keepIds = messagesToKeep.map(m => m.id);
        
        // Delete all messages except those to keep
        if (keepIds.length > 0) {
          await prisma.chatMessage.deleteMany({
            where: {
              sessionId: session.id,
              id: { notIn: keepIds }
            }
          });
        }
        
        processedSessions++;
      }

      return processedSessions;
    } catch (error) {
      logger.error("Error in chat message cleanup:", error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const cleanupJob = new CleanupJob();