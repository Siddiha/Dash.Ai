// backend/src/controllers/dashboard.controller.ts
import { Request, Response } from "express";
import { prisma } from "../config/database";
import { IntegrationService } from "../services/integrations.service";

export class DashboardController {
  static async getDashboardData(req: any, res: Response) {
    try {
      const userId = req.user.id;

      // Get task statistics
      const tasks = await prisma.task.groupBy({
        by: ["status"],
        where: { userId },
        _count: { status: true },
      });

      const taskStats = {
        total: tasks.reduce((sum: number, t: any) => sum + t._count.status, 0),
        pending:
          tasks.find((t: any) => t.status === "PENDING")?._count.status || 0,
        inProgress:
          tasks.find((t: any) => t.status === "IN_PROGRESS")?._count.status ||
          0,
        completed:
          tasks.find((t: any) => t.status === "COMPLETED")?._count.status || 0,
        overdue: 0, // Calculate overdue tasks
      };

      // Get integration statistics
      const integrations = await prisma.integration.findMany({
        where: { userId, isConnected: true },
      });

      const integrationStats = {
        connected: integrations.length,
        total: 8, // Total available integrations
        status: integrations.map((i: any) => ({
          type: i.type,
          name: i.name,
          isConnected: i.isConnected,
          lastSync: i.lastSync,
        })),
      };

      // Get recent data from integrations
      let emailData = { unread: 0, total: 0, recent: [] };
      let calendarData = { upcomingEvents: [], todayEvents: 0 };

      try {
        const gmailIntegration = integrations.find(
          (i: any) => i.type === "GMAIL"
        );
        if (gmailIntegration) {
          const gmailService = new IntegrationService(gmailIntegration);
          const emails = await gmailService.getRecentData();
          emailData = {
            unread: emails.length,
            total: emails.length + 50, // Placeholder
            recent: emails.slice(0, 5),
          };
        }

        const calendarIntegration = integrations.find(
          (i: any) => i.type === "GOOGLE_CALENDAR"
        );
        if (calendarIntegration) {
          const calendarService = new IntegrationService(calendarIntegration);
          const events = await calendarService.getRecentData();
          const today = new Date().toDateString();
          calendarData = {
            upcomingEvents: events.slice(0, 5),
            todayEvents: events.filter(
              (e: any) => new Date(e.start).toDateString() === today
            ).length,
          };
        }
      } catch (error) {
        console.error("Failed to get integration data:", error);
      }

      const dashboardData = {
        tasks: taskStats,
        emails: emailData,
        calendar: calendarData,
        integrations: integrationStats,
      };

      return res.json(dashboardData);
    } catch (error) {
      console.error("Dashboard error:", error);
      return res.status(500).json({ error: "Failed to get dashboard data" });
    }
  }

  static async getAnalytics(req: any, res: Response) {
    try {
      const userId = req.user.id;
      const { timeframe = "7d" } = req.query;

      const days = timeframe === "30d" ? 30 : 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Task completion trends
      const taskTrends = await prisma.task.groupBy({
        by: ["completedAt"],
        where: {
          userId,
          completedAt: { gte: startDate },
        },
        _count: { completedAt: true },
      });

      // Workflow execution trends
      const workflowTrends = await prisma.workflowExecution.groupBy({
        by: ["startedAt"],
        where: {
          workflow: { userId },
          startedAt: { gte: startDate },
        },
        _count: { startedAt: true },
      });

      return res.json({
        taskTrends,
        workflowTrends,
        timeframe,
        period: `${days} days`,
      });
    } catch (error) {
      return res.status(500).json({ error: "Failed to get analytics data" });
    }
  }
}
