// backend/src/routes/integrations.routes.ts
import { Router } from "express";
import { IntegrationController } from "../controllers/integrations.controller";

const router = Router();

router.get("/", IntegrationController.getUserIntegrations);
router.post("/:type/connect", IntegrationController.connectIntegration);
router.delete("/:id", IntegrationController.disconnectIntegration);
router.post("/:id/sync", IntegrationController.syncIntegration);
router.get("/:id/data", IntegrationController.getIntegrationData);

export default router;



// backend/src/controllers/integrations.controller.ts
import { Request, Response } from "express";
import { prisma } from "../config/database";
import { IntegrationService } from "../services/integrations.service";
import { google } from "googleapis";
import { OAUTH_CONFIG } from "../config/oauth";

export class IntegrationController {
  static async getUserIntegrations(req: any, res: Response) {
    try {
      const userId = req.user.id;

      const integrations = await prisma.integration.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          name: true,
          isConnected: true,
          lastSync: true,
          createdAt: true,
        },
      });

      res.json(integrations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get integrations" });
    }
  }

  static async connectIntegration(req: any, res: Response) {
    try {
      const { type } = req.params;
      const userId = req.user.id;

      switch (type) {
        case "GMAIL":
        case "GOOGLE_CALENDAR":
          const oauth2Client = new google.auth.OAuth2(
            OAUTH_CONFIG.google.clientId,
            OAUTH_CONFIG.google.clientSecret,
            OAUTH_CONFIG.google.redirectUri
          );

          const authUrl = oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: OAUTH_CONFIG.google.scopes,
            prompt: "consent",
            state: JSON.stringify({ userId, type }),
          });

          res.json({ authUrl });
          break;

        case "NOTION":
          const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${
            OAUTH_CONFIG.notion.clientId
          }&response_type=code&owner=user&redirect_uri=${encodeURIComponent(
            OAUTH_CONFIG.notion.redirectUri
          )}&state=${JSON.stringify({ userId, type })}`;
          res.json({ authUrl: notionAuthUrl });
          break;

        case "SLACK":
          const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${
            OAUTH_CONFIG.slack.clientId
          }&scope=chat:write,channels:read,users:read&redirect_uri=${encodeURIComponent(
            OAUTH_CONFIG.slack.redirectUri
          )}&state=${JSON.stringify({ userId, type })}`;
          res.json({ authUrl: slackAuthUrl });
          break;

        default:
          res.status(400).json({ error: "Unsupported integration type" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to connect integration" });
    }
  }

  static async disconnectIntegration(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await prisma.integration.deleteMany({
        where: { id, userId },
      });

      res.json({ message: "Integration disconnected successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to disconnect integration" });
    }
  }

  static async syncIntegration(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const integration = await prisma.integration.findFirst({
        where: { id, userId },
      });

      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      const service = new IntegrationService(integration);
      await service.sync();

      await prisma.integration.update({
        where: { id },
        data: { lastSync: new Date() },
      });

      res.json({ message: "Integration synced successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to sync integration" });
    }
  }

  static async getIntegrationData(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const integration = await prisma.integration.findFirst({
        where: { id, userId },
      });

      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      const service = new IntegrationService(integration);
      const data = await service.getRecentData();

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to get integration data" });
    }
  }
}




// backend/src/services/integrations.service.ts
import { Integration } from "@prisma/client";
import { GmailService } from "./integrations/gmail.service";
import { CalendarService } from "./integrations/calendar.service";
import { NotionService } from "./integrations/notion.service";
import { SlackService } from "./integrations/slack.service";

export class IntegrationService {
  private service: any;

  constructor(integration: Integration) {
    switch (integration.type) {
      case "GMAIL":
        this.service = new GmailService(
          integration.accessToken!,
          integration.refreshToken!
        );
        break;
      case "GOOGLE_CALENDAR":
        this.service = new CalendarService(
          integration.accessToken!,
          integration.refreshToken!
        );
        break;
      case "NOTION":
        this.service = new NotionService(integration.accessToken!);
        break;
      case "SLACK":
        this.service = new SlackService(integration.accessToken!);
        break;
      default:
        throw new Error(`Unsupported integration type: ${integration.type}`);
    }
  }

  async testConnection(): Promise<boolean> {
    return this.service.testConnection();
  }

  async sync(): Promise<void> {
    // Implement sync logic based on integration type
    console.log("Syncing integration...");
  }

  async getRecentData(): Promise<any> {
    switch (this.service.constructor.name) {
      case "GmailService":
        return this.service.getEmails(10);
      case "CalendarService":
        return this.service.getEvents();
      case "NotionService":
        return this.service.getPages();
      case "SlackService":
        return this.service.getChannels();
      default:
        return [];
    }
  }

  async executeAction(action: string, params: any): Promise<any> {
    switch (action) {
      case "sendEmail":
        return this.service.sendEmail(params.to, params.subject, params.body);
      case "createEvent":
        return this.service.createEvent(params);
      case "createPage":
        return this.service.createPage(params.parentId, params.properties);
      case "sendMessage":
        return this.service.sendMessage(params.channel, params.message);
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }
}

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

// backend/src/sockets/chat.socket.ts
import { Server, Socket } from "socket.io";

export function setupChatSockets(io: Server) {
  const chatNamespace = io.of("/chat");

  chatNamespace.on("connection", (socket: Socket) => {
    console.log("User connected to chat:", socket.id);

    socket.on("join-room", (userId: string) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    socket.on("typing", (data) => {
      socket.to(`user-${data.userId}`).emit("user-typing", data);
    });

    socket.on("stop-typing", (data) => {
      socket.to(`user-${data.userId}`).emit("user-stop-typing", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected from chat:", socket.id);
    });
  });
}

// backend/src/sockets/workflow.socket.ts
import { Server, Socket } from "socket.io";

export function setupWorkflowSockets(io: Server) {
  const workflowNamespace = io.of("/workflows");

  workflowNamespace.on("connection", (socket: Socket) => {
    console.log("User connected to workflows:", socket.id);

    socket.on("join-workflow", (workflowId: string) => {
      socket.join(`workflow-${workflowId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected from workflows:", socket.id);
    });
  });

  // Emit workflow execution updates
  return {
    emitExecutionUpdate: (workflowId: string, data: any) => {
      workflowNamespace
        .to(`workflow-${workflowId}`)
        .emit("execution-update", data);
    },
  };
}

// backend/src/sockets/notifications.socket.ts
import { Server, Socket } from "socket.io";

export function setupNotificationSockets(io: Server) {
  const notificationNamespace = io.of("/notifications");

  notificationNamespace.on("connection", (socket: Socket) => {
    console.log("User connected to notifications:", socket.id);

    socket.on("join-user", (userId: string) => {
      socket.join(`user-${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected from notifications:", socket.id);
    });
  });

  return {
    sendNotification: (userId: string, notification: any) => {
      notificationNamespace
        .to(`user-${userId}`)
        .emit("notification", notification);
    },
  };
}

// frontend/src/components/dashboard/TaskList.tsx
import React from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/outline";

interface Task {
  id: string;
  title: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  dueDate?: string;
}

interface TaskListProps {
  tasks?: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
}

function TaskList({ tasks }: TaskListProps) {
  const mockTasks: Task[] = [
    {
      id: "1",
      title: "Review Q4 financial reports",
      priority: "HIGH",
      status: "PENDING",
      dueDate: "2024-01-15",
    },
    {
      id: "2",
      title: "Schedule team meeting",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
    },
    {
      id: "3",
      title: "Update project documentation",
      priority: "LOW",
      status: "PENDING",
      dueDate: "2024-01-20",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "text-red-600 bg-red-100";
      case "HIGH":
        return "text-orange-600 bg-orange-100";
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-100";
      case "LOW":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "IN_PROGRESS":
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case "PENDING":
        return <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Tasks</h3>
        {tasks && (
          <p className="text-sm text-gray-500">
            {tasks.pending} pending, {tasks.inProgress} in progress
          </p>
        )}
      </div>

      <div className="divide-y divide-gray-200">
        {mockTasks.map((task) => (
          <div key={task.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(task.status)}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {task.title}
                  </p>
                  {task.dueDate && (
                    <p className="text-xs text-gray-500">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-3 border-t border-gray-200">
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          View all tasks →
        </button>
      </div>
    </div>
  );
}

export default TaskList;

// frontend/src/components/dashboard/QuickActions.tsx
import React from "react";
import {
  MailIcon,
  CalendarIcon,
  PlusIcon,
  ChatIcon,
} from "@heroicons/react/outline";

function QuickActions() {
  const actions = [
    {
      name: "Send Email",
      icon: MailIcon,
      color: "bg-blue-500 hover:bg-blue-600",
      action: () => console.log("Send email"),
    },
    {
      name: "Schedule Meeting",
      icon: CalendarIcon,
      color: "bg-green-500 hover:bg-green-600",
      action: () => console.log("Schedule meeting"),
    },
    {
      name: "Create Task",
      icon: PlusIcon,
      color: "bg-purple-500 hover:bg-purple-600",
      action: () => console.log("Create task"),
    },
    {
      name: "Ask AI",
      icon: ChatIcon,
      color: "bg-orange-500 hover:bg-orange-600",
      action: () => console.log("Ask AI"),
    },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <button
            key={action.name}
            onClick={action.action}
            className={`${action.color} text-white p-4 rounded-lg transition-colors flex flex-col items-center space-y-2`}
          >
            <action.icon className="h-6 w-6" />
            <span className="text-sm font-medium">{action.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;

// frontend/src/components/dashboard/IntegrationStatus.tsx
import React from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from "@heroicons/react/outline";

interface IntegrationStatusProps {
  integrations?: {
    connected: number;
    total: number;
    status: Array<{
      type: string;
      name: string;
      isConnected: boolean;
      lastSync: string;
    }>;
  };
}

function IntegrationStatus({ integrations }: IntegrationStatusProps) {
  const getStatusIcon = (isConnected: boolean) => {
    return isConnected ? (
      <CheckCircleIcon className="h-5 w-5 text-green-500" />
    ) : (
      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
    );
  };

  const getIntegrationIcon = (type: string) => {
    const icons: Record<string, string> = {
      GMAIL: "📧",
      GOOGLE_CALENDAR: "📅",
      NOTION: "📝",
      SLACK: "💬",
      HUBSPOT: "🎯",
      LINEAR: "📋",
    };
    return icons[type] || "🔗";
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Integrations</h3>
        {integrations && (
          <p className="text-sm text-gray-500">
            {integrations.connected} of {integrations.total} connected
          </p>
        )}
      </div>

      <div className="divide-y divide-gray-200">
        {integrations?.status?.map((integration) => (
          <div
            key={integration.type}
            className="px-6 py-4 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">
                {getIntegrationIcon(integration.type)}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {integration.name}
                </p>
                {integration.lastSync && (
                  <p className="text-xs text-gray-500">
                    Synced:{" "}
                    {new Date(integration.lastSync).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            {getStatusIcon(integration.isConnected)}
          </div>
        ))}

        {(!integrations?.status || integrations.status.length === 0) && (
          <div className="px-6 py-8 text-center text-gray-500">
            <ClockIcon className="mx-auto h-8 w-8 mb-2" />
            <p className="text-sm">No integrations connected yet</p>
          </div>
        )}
      </div>

      <div className="px-6 py-3 border-t border-gray-200">
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          Manage integrations →
        </button>
      </div>
    </div>
  );
}

export default IntegrationStatus;

// frontend/src/components/workflows/WorkflowBuilder.tsx
import React, { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XIcon, PlusIcon } from "@heroicons/react/outline";
import { Fragment } from "react";

interface WorkflowBuilderProps {
  open: boolean;
  onClose: () => void;
  template?: any;
  onSave: () => void;
}

function WorkflowBuilder({
  open,
  onClose,
  template,
  onSave,
}: WorkflowBuilderProps) {
  const [workflowName, setWorkflowName] = useState(template?.name || "");
  const [workflowDescription, setWorkflowDescription] = useState(
    template?.description || ""
  );

  const handleSave = () => {
    // Implementation for saving workflow
    console.log("Saving workflow:", { workflowName, workflowDescription });
    onSave();
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={onClose}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-4">
                      <Dialog.Title
                        as="h3"
                        className="text-lg leading-6 font-medium text-gray-900"
                      >
                        {template
                          ? `Create Workflow: ${template.name}`
                          : "Create New Workflow"}
                      </Dialog.Title>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-500"
                        onClick={onClose}
                      >
                        <XIcon className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Workflow Name
                        </label>
                        <input
                          type="text"
                          value={workflowName}
                          onChange={(e) => setWorkflowName(e.target.value)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter workflow name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={workflowDescription}
                          onChange={(e) =>
                            setWorkflowDescription(e.target.value)
                          }
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Describe what this workflow does"
                        />
                      </div>

                      {/* Workflow Builder UI would go here */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <PlusIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                          Workflow builder interface would be implemented here
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          This would include drag-and-drop workflow steps,
                          trigger configuration, etc.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!workflowName.trim()}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  Create Workflow
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default WorkflowBuilder;

// frontend/src/pages/Settings.tsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import toast from "react-hot-toast";

function Settings() {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    timezone: user?.timezone || "UTC",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.patch("/auth/profile", formData);
      updateUser(response.data);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Profile Information
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) =>
                  setFormData({ ...formData, timezone: e.target.value })
                }
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Settings;
