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

      // Clean old workflow executions
      const deletedExecutions = await prisma.workflowExecution.deleteMany({
        where: {
          startedAt: { lt: thirtyDaysAgo },
          status: "COMPLETED",
        },
      });

      // Clean old chat messages (keep last 100 per session)
      const chatSessions = await prisma.chatSession.findMany({
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            skip: 100,
          },
        },
      });

      for (const session of chatSessions) {
        if (session.messages.length > 0) {
          await prisma.chatMessage.deleteMany({
            where: {
              sessionId: session.id,
              id: { in: session.messages.map((m) => m.id) },
            },
          });
        }
      }

      // Clean old logs
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      await prisma.integrationLog.deleteMany({
        where: {
          createdAt: { lt: sevenDaysAgo },
        },
      });

      logger.info("Cleanup completed", {
        deletedExecutions: deletedExecutions.count,
      });
    } catch (error) {
      logger.error("Error during cleanup:", error);
    }
  }
}
