// backend/src/services/workflow/workflow.service.ts
import { Workflow, WorkflowStep } from "@prisma/client";
import { prisma } from "../../config/database";
import { IntegrationService } from "../integrations.service";

export class WorkflowService {
  async executeWorkflow(workflow: any, triggerData: any) {
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    try {
      const logs: any[] = [];

      for (const step of workflow.steps) {
        logs.push(`Executing step: ${step.action}`);

        const integrationService = new IntegrationService(step.integration);
        const result = await integrationService.executeAction(step.action, {
          ...step.parameters,
          ...triggerData,
        });

        logs.push(`Step completed: ${JSON.stringify(result)}`);
      }

      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          logs: logs,
        },
      });

      return { ...execution, status: "COMPLETED", logs };
    } catch (error) {
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });

      throw error;
    }
  }
}
