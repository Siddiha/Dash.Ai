import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma, workflowEngine } from '../index';

const createWorkflowSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  trigger: z.any(),
  actions: z.array(z.any()),
});

const updateWorkflowSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  trigger: z.any().optional(),
  actions: z.array(z.any()).optional(),
  isActive: z.boolean().optional(),
});

class WorkflowController {
  async getWorkflows(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const workflows = await prisma.workflow.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { executions: true },
          },
        },
      });

      res.json(workflows);
    } catch (error) {
      console.error('Get workflows error:', error);
      res.status(500).json({ error: 'Failed to fetch workflows' });
    }
  }

  async createWorkflow(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const data = createWorkflowSchema.parse(req.body);

      const workflow = await prisma.workflow.create({
        data: {
          userId,
          ...data,
        },
      });

      // Schedule workflow if it has a schedule trigger
      if (data.trigger.type === 'schedule') {
        await workflowEngine.scheduleWorkflow(workflow.id, data.trigger);
      }

      res.status(201).json(workflow);
    } catch (error) {
      console.error('Create workflow error:', error);
      res.status(500).json({ error: 'Failed to create workflow' });
    }
  }

  async getWorkflow(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      const workflow = await prisma.workflow.findUnique({
        where: { id, userId },
        include: {
          executions: {
            orderBy: { startedAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      res.json(workflow);
    } catch (error) {
      console.error('Get workflow error:', error);
      res.status(500).json({ error: 'Failed to fetch workflow' });
    }
  }

  async updateWorkflow(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      const data = updateWorkflowSchema.parse(req.body);

      const workflow = await prisma.workflow.update({
        where: { id, userId },
        data,
      });

      // Reschedule if trigger changed
      if (data.trigger) {
        await workflowEngine.cancelWorkflow(id);
        if (data.trigger.type === 'schedule' && workflow.isActive) {
          await workflowEngine.scheduleWorkflow(id, data.trigger);
        }
      }

      res.json(workflow);
    } catch (error) {
      console.error('Update workflow error:', error);
      res.status(500).json({ error: 'Failed to update workflow' });
    }
  }

  async deleteWorkflow(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      // Cancel scheduled jobs
      await workflowEngine.cancelWorkflow(id);

      await prisma.workflow.delete({
        where: { id, userId },
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Delete workflow error:', error);
      res.status(500).json({ error: 'Failed to delete workflow' });
    }
  }

  async executeWorkflow(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      const workflow = await prisma.workflow.findUnique({
        where: { id, userId },
      });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      const execution = await workflowEngine.scheduleWorkflow(id, { type: 'manual' });

      res.json(execution);
    } catch (error) {
      console.error('Execute workflow error:', error);
      res.status(500).json({ error: 'Failed to execute workflow' });
    }
  }

  async getExecutions(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      const workflow = await prisma.workflow.findUnique({
        where: { id, userId },
      });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      const executions = await prisma.workflowExecution.findMany({
        where: { workflowId: id },
        orderBy: { startedAt: 'desc' },
        take: 50,
      });

      res.json(executions);
    } catch (error) {
      console.error('Get executions error:', error);
      res.status(500).json({ error: 'Failed to fetch executions' });
    }
  }

  async toggleWorkflow(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      const workflow = await prisma.workflow.findUnique({
        where: { id, userId },
      });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      const updated = await prisma.workflow.update({
        where: { id },
        data: { isActive: !workflow.isActive },
      });

      // Handle scheduling
      if (updated.isActive && updated.trigger.type === 'schedule') {
        await workflowEngine.scheduleWorkflow(id, updated.trigger);
      } else if (!updated.isActive) {
        await workflowEngine.cancelWorkflow(id);
      }

      res.json(updated);
    } catch (error) {
      console.error('Toggle workflow error:', error);
      res.status(500).json({ error: 'Failed to toggle workflow' });
    }
  }
}

export default new WorkflowController();