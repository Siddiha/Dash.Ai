/ backend/crs / jobs / email.job.ts;
import cron from "node-cron";
import { prisma } from "../config/database";
import { GmailService } from "../services/integrations/gmail.service";
import { logger } from "../utils/logger";

export class EmailJob {
  start() {
    // Check for new emails every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
      await this.processNewEmails();
    });

    logger.info("Email job scheduler started");
  }

  private async processNewEmails() {
    try {
      const gmailIntegrations = await prisma.integration.findMany({
        where: {
          type: "GMAIL",
          isConnected: true,
        },
      });

      for (const integration of gmailIntegrations) {
        const gmailService = new GmailService(
          integration.accessToken!,
          integration.refreshToken!
        );

        const emails = await gmailService.getEmails(10);

        // Process emails for workflow triggers
        await this.checkEmailTriggers(integration.userId, emails);
      }
    } catch (error) {
      logger.error("Error processing new emails:", error);
    }
  }

  private async checkEmailTriggers(userId: string, emails: any[]) {
    const emailTriggerWorkflows = await prisma.workflow.findMany({
      where: {
        userId,
        isActive: true,
        trigger: {
          path: ["type"],
          equals: "email",
        },
      },
      include: {
        steps: {
          include: { integration: true },
        },
      },
    });

    for (const email of emails) {
      for (const workflow of emailTriggerWorkflows) {
        if (this.emailMatchesTrigger(email, workflow.trigger)) {
          const workflowService = new (
            await import("../services/workflow/workflow.service")
          ).WorkflowService();
          await workflowService.executeWorkflow(workflow, { email });
          logger.info(`Executed email-triggered workflow: ${workflow.name}`);
        }
      }
    }
  }

  private emailMatchesTrigger(email: any, trigger: any): boolean {
    // Implement email trigger matching logic
    const conditions = trigger.conditions || {};

    if (conditions.fromEmail && !email.from.includes(conditions.fromEmail)) {
      return false;
    }

    if (
      conditions.subject &&
      !email.subject.toLowerCase().includes(conditions.subject.toLowerCase())
    ) {
      return false;
    }

    return true;
  }
}
