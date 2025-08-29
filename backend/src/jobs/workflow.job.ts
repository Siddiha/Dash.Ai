//backend / src / jobs / workflow.job.ts;
import cron from "node-cron";
import { prisma } from "../config/database";
import { WorkflowService } from "../services/workflow/workflow.service";
import { logger } from "../utils/logger";
export class WorkflowJob {
  private workflowService: WorkflowService;

  constructor() {
    this.workflowService = new WorkflowService();
  }

  start() {
    // Run scheduled workflows every minute
    cron.schedule("* * * * *", async () => {
      await this.processScheduledWorkflows();
    });

    logger.info("Workflow job scheduler started");
  }

  private async processScheduledWorkflows() {
    try {
      const scheduledWorkflows = await prisma.workflow.findMany({
        where: {
          isActive: true,
          trigger: {
            path: ["type"],
            equals: "schedule",
          },
        },
        include: {
          steps: {
            include: { integration: true },
          },
        },
      });

      for (const workflow of scheduledWorkflows) {
        if (this.shouldExecute(workflow.trigger)) {
          await this.workflowService.executeWorkflow(workflow, {});
          logger.info(`Executed scheduled workflow: ${workflow.name}`);
        }
      }
    } catch (error) {
      logger.error("Error processing scheduled workflows:", error);
    }
  }

  private shouldExecute(trigger: any): boolean {
    // Implement scheduling logic based on trigger configuration
    const now = new Date();
    const schedule = trigger.schedule;

    if (!schedule) return false;

    // Simple daily schedule check
    if (schedule.frequency === "daily") {
      const targetHour = schedule.hour || 9;
      const targetMinute = schedule.minute || 0;

      return now.getHours() === targetHour && now.getMinutes() === targetMinute;
    }

    return false;
  }
}

