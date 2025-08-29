// backend/src/controllers/workflow.controller.ts
import { Request, Response } from "express";
import { prisma } from "../config/database";
import { WorkflowService } from "../services/workflow/workflow.service";

export class WorkflowController {
  static async getUserWorkflows(req: any, res: Response) {
    try {
      const userId = req.user.id;

      const workflows = await prisma.workflow.findMany({
        where: { userId },
        include: {
          steps: {
            include: {
              integration: {
                select: { type: true, name: true },
              },
            },
          },
          executions: {
            take: 1,
            orderBy: { startedAt: "desc" },
          },
        },
      });

      const workflowsWithStats = workflows.map((workflow) => ({
        ...workflow,
        executions: {
          total: workflow.executions.length,
          successful: workflow.executions.filter(
            (e) => e.status === "COMPLETED"
          ).length,
          failed: workflow.executions.filter((e) => e.status === "FAILED")
            .length,
          lastRun: workflow.executions[0]?.startedAt,
        },
      }));

      res.json(workflowsWithStats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get workflows" });
    }
  }

  static async createWorkflow(req: any, res: Response) {
    try {
      const userId = req.user.id;
      const { name, description, trigger, steps } = req.body;

      const workflow = await prisma.workflow.create({
        data: {
          userId,
          name,
          description,
          trigger,
          steps: {
            create: steps.map((step: any, index: number) => ({
              integrationId: step.integrationId,
              stepOrder: index,
              action: step.action,
              parameters: step.parameters,
            })),
          },
        },
        include: {
          steps: true,
        },
      });

      res.json(workflow);
    } catch (error) {
      res.status(500).json({ error: "Failed to create workflow" });
    }
  }

  static async getWorkflow(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const workflow = await prisma.workflow.findFirst({
        where: { id, userId },
        include: {
          steps: {
            include: {
              integration: true,
            },
          },
          executions: {
            orderBy: { startedAt: "desc" },
            take: 10,
          },
        },
      });

      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      res.json(workflow);
    } catch (error) {
      res.status(500).json({ error: "Failed to get workflow" });
    }
  }

  static async updateWorkflow(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      const workflow = await prisma.workflow.updateMany({
        where: { id, userId },
        data: updates,
      });

      if (workflow.count === 0) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      res.json({ message: "Workflow updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update workflow" });
    }
  }

  static async deleteWorkflow(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await prisma.workflow.deleteMany({
        where: { id, userId },
      });

      if (result.count === 0) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      res.json({ message: "Workflow deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workflow" });
    }
  }

  static async executeWorkflow(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const workflow = await prisma.workflow.findFirst({
        where: { id, userId },
        include: {
          steps: {
            include: { integration: true },
          },
        },
      });

      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const workflowService = new WorkflowService();
      const execution = await workflowService.executeWorkflow(workflow, {});

      res.json(execution);
    } catch (error) {
      res.status(500).json({ error: "Failed to execute workflow" });
    }
  }

  static async getWorkflowExecutions(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const workflow = await prisma.workflow.findFirst({
        where: { id, userId },
      });

      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const executions = await prisma.workflowExecution.findMany({
        where: { workflowId: id },
        orderBy: { startedAt: "desc" },
        take: 50,
      });

      res.json(executions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get workflow executions" });
    }
  }
}


