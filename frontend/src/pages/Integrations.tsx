// frontend/src/pages/Integrations.tsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  PuzzleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  RefreshIcon,
} from "@heroicons/react/outline";
import { api } from "../services/api";
import toast from "react-hot-toast";

interface Integration {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isConnected: boolean;
  lastSync?: string;
  features: string[];
  category: string;
}

const integrationConfigs: Record<
  string,
  Omit<Integration, "id" | "isConnected" | "lastSync">
> = {
  GMAIL: {
    type: "GMAIL",
    name: "Gmail",
    description: "Read, send, and organize your emails with AI assistance",
    icon: "📧",
    color: "from-red-500 to-red-600",
    features: [
      "Read emails",
      "Send emails",
      "Auto-categorize",
      "Smart replies",
      "Extract action items",
    ],
    category: "Communication",
  },
  GOOGLE_CALENDAR: {
    type: "GOOGLE_CALENDAR",
    name: "Google Calendar",
    description: "Manage your schedule and create events automatically",
    icon: "📅",
    color: "from-blue-500 to-blue-600",
    features: [
      "Schedule meetings",
      "Create events",
      "Find available times",
      "Send invites",
      "Sync calendars",
    ],
    category: "Productivity",
  },
  NOTION: {
    type: "NOTION",
    name: "Notion",
    description: "Create pages, update databases, and organize your workspace",
    icon: "📝",
    color: "from-gray-800 to-gray-900",
    features: [
      "Create pages",
      "Update databases",
      "Manage tasks",
      "Share content",
      "Team collaboration",
    ],
    category: "Productivity",
  },
  SLACK: {
    type: "SLACK",
    name: "Slack",
    description: "Send messages and coordinate with your team",
    icon: "💬",
    color: "from-green-500 to-green-600",
    features: [
      "Send messages",
      "Create channels",
      "Share files",
      "Team updates",
      "Notifications",
    ],
    category: "Communication",
  },
  HUBSPOT: {
    type: "HUBSPOT",
    name: "HubSpot",
    description: "Manage contacts, deals, and sales activities",
    icon: "🎯",
    color: "from-orange-500 to-orange-600",
    features: [
      "Manage contacts",
      "Track deals",
      "Sales automation",
      "Lead scoring",
      "Pipeline management",
    ],
    category: "Sales",
  },
  LINEAR: {
    type: "LINEAR",
    name: "Linear",
    description: "Create and manage project tasks and issues",
    icon: "📋",
    color: "from-purple-500 to-purple-600",
    features: [
      "Create issues",
      "Track progress",
      "Project management",
      "Team workflows",
      "Sprint planning",
    ],
    category: "Project Management",
  },
};

function Integrations() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const queryClient = useQueryClient();

  const { data: userIntegrations, isLoading } = useQuery<Integration[]>({
    queryKey: ["integrations"],
    queryFn: async () => {
      const response = await api.get("/integrations");
      return response.data;
    },
  });

  const connectMutation = useMutation({
    mutationFn: async (integrationType: string) => {
      const response = await api.post(
        `/integrations/${integrationType}/connect`
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        queryClient.invalidateQueries({ queryKey: ["integrations"] });
        toast.success("Integration connected successfully!");
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Failed to connect integration"
      );
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      await api.delete(`/integrations/${integrationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("Integration disconnected successfully!");
    },
    onError: () => {
      toast.error("Failed to disconnect integration");
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      await api.post(`/integrations/${integrationId}/sync`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("Integration synced successfully!");
    },
    onError: () => {
      toast.error("Failed to sync integration");
    },
  });

  // Merge user integrations with configs
  const integrations = Object.values(integrationConfigs).map((config) => {
    const userIntegration = userIntegrations?.find(
      (ui) => ui.type === config.type
    );
    return {
      ...config,
      id: userIntegration?.id || config.type,
      isConnected: userIntegration?.isConnected || false,
      lastSync: userIntegration?.lastSync,
    };
  });

  const categories = [
    "All",
    ...Array.from(new Set(integrations.map((i) => i.category))),
  ];

  const filteredIntegrations =
    selectedCategory === "All"
      ? integrations
      : integrations.filter((i) => i.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connect your favorite apps to enable AI automation across your
          workflow
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Connected</p>
              <p className="text-2xl font-bold text-gray-900">
                {integrations.filter((i) => i.isConnected).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <PuzzleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-gray-900">
                {integrations.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {integrations.filter((i) => !i.isConnected).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration, index) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            {/* Header */}
            <div
              className={`bg-gradient-to-r ${integration.color} p-6 text-white`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{integration.icon}</span>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {integration.name}
                    </h3>
                    <p className="text-sm opacity-90">{integration.category}</p>
                  </div>
                </div>
                {integration.isConnected && (
                  <CheckCircleIcon className="h-6 w-6 text-green-200" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-600 mb-4">{integration.description}</p>

              {/* Features */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Features:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {integration.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                  {integration.features.length > 3 && (
                    <li className="text-xs text-gray-500">
                      +{integration.features.length - 3} more features
                    </li>
                  )}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                {integration.isConnected ? (
                  <>
                    <button
                      onClick={() => syncMutation.mutate(integration.id)}
                      disabled={syncMutation.isPending}
                      className="flex-1 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <RefreshIcon
                        className={`h-4 w-4 ${
                          syncMutation.isPending ? "animate-spin" : ""
                        }`}
                      />
                      <span>Sync</span>
                    </button>
                    <button
                      onClick={() => disconnectMutation.mutate(integration.id)}
                      disabled={disconnectMutation.isPending}
                      className="flex-1 bg-red-50 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => connectMutation.mutate(integration.type)}
                    disabled={connectMutation.isPending}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center space-x-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Connect</span>
                  </button>
                )}
              </div>

              {/* Last Sync */}
              {integration.isConnected && integration.lastSync && (
                <p className="text-xs text-gray-500 mt-2">
                  Last synced: {new Date(integration.lastSync).toLocaleString()}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default Integrations;

// frontend/src/pages/Workflows.tsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CollectionIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/outline";
import { api } from "../services/api";
import toast from "react-hot-toast";
import WorkflowBuilder from "../components/workflows/WorkflowBuilder";

interface Workflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger: {
    type: string;
    integration: string;
    conditions: any;
  };
  steps: Array<{
    id: string;
    integrationId: string;
    action: string;
    parameters: any;
  }>;
  executions: {
    total: number;
    successful: number;
    failed: number;
    lastRun?: string;
  };
  createdAt: string;
}

const workflowTemplates = [
  {
    name: "Email to Task",
    description: "Convert important emails into tasks automatically",
    icon: "📧➡️📝",
    trigger: "Gmail - New Email",
    actions: ["Create Notion Task", "Notify Slack"],
    category: "Productivity",
  },
  {
    name: "Meeting Follow-up",
    description: "Send follow-up emails after meetings end",
    icon: "📅➡️📧",
    trigger: "Calendar - Meeting Ended",
    actions: ["Send Gmail", "Create HubSpot Task"],
    category: "Communication",
  },
  {
    name: "Lead Processing",
    description: "Automatically process and qualify new leads",
    icon: "🎯➡️📊",
    trigger: "HubSpot - New Contact",
    actions: ["Research Company", "Update Database", "Assign to Rep"],
    category: "Sales",
  },
  {
    name: "Task Reminder",
    description: "Send reminders for overdue tasks",
    icon: "⏰➡️💬",
    trigger: "Schedule - Daily",
    actions: ["Check Tasks", "Send Slack Message"],
    category: "Productivity",
  },
];

function Workflows() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: workflows, isLoading } = useQuery<Workflow[]>({
    queryKey: ["workflows"],
    queryFn: async () => {
      const response = await api.get("/workflows");
      return response.data;
    },
  });

  const toggleWorkflowMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.patch(`/workflows/${id}`, { isActive: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update workflow");
    },
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workflows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete workflow");
    },
  });

  const handleCreateFromTemplate = (template: any) => {
    setSelectedTemplate(template);
    setShowBuilder(true);
  };

  const stats = {
    total: workflows?.length || 0,
    active: workflows?.filter((w) => w.isActive).length || 0,
    executions: workflows?.reduce((sum, w) => sum + w.executions.total, 0) || 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="mt-1 text-sm text-gray-500">
            Automate your tasks with powerful cross-platform workflows
          </p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Workflow</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CollectionIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Workflows
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <PlayIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Executions</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.executions}
              </p>
            </div>
          </div>
        </div>
      </div>

      {workflows && workflows.length > 0 ? (
        <>
          {/* Existing Workflows */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Your Workflows
            </h2>
            <div className="grid gap-6">
              {workflows.map((workflow, index) => (
                <motion.div
                  key={workflow.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-lg p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {workflow.name}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            workflow.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {workflow.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">
                        {workflow.description}
                      </p>

                      <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          <span>
                            {workflow.executions.successful} successful
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
                          <span>{workflow.executions.failed} failed</span>
                        </div>
                        {workflow.executions.lastRun && (
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="h-4 w-4" />
                            <span>
                              Last run:{" "}
                              {new Date(
                                workflow.executions.lastRun
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() =>
                          toggleWorkflowMutation.mutate({
                            id: workflow.id,
                            isActive: workflow.isActive,
                          })
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          workflow.isActive
                            ? "text-orange-600 hover:bg-orange-50"
                            : "text-green-600 hover:bg-green-50"
                        }`}
                        title={
                          workflow.isActive
                            ? "Pause workflow"
                            : "Start workflow"
                        }
                      >
                        {workflow.isActive ? (
                          <PauseIcon className="h-5 w-5" />
                        ) : (
                          <PlayIcon className="h-5 w-5" />
                        )}
                      </button>

                      <button
                        onClick={() =>
                          deleteWorkflowMutation.mutate(workflow.id)
                        }
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete workflow"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Workflow Steps Preview */}
                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="font-medium text-gray-700">
                        Trigger:
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {workflow.trigger.integration} - {workflow.trigger.type}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-gray-700">
                        {workflow.steps.length} action
                        {workflow.steps.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Empty State with Templates */}
          <div className="text-center py-12">
            <CollectionIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No workflows yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first automated workflow
            </p>
          </div>
        </>
      )}

      {/* Templates Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Workflow Templates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workflowTemplates.map((template, index) => (
            <motion.div
              key={template.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {template.category}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600 mt-2">{template.description}</p>

                  <div className="mt-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">Trigger:</span>
                      <span className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                        {template.trigger}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mt-2">
                      <span className="font-medium">Actions:</span>
                      <div className="ml-2 flex flex-wrap gap-1">
                        {template.actions.map((action, idx) => (
                          <span
                            key={idx}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                          >
                            {action}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCreateFromTemplate(template)}
                  className="ml-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  Use Template
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Workflow Builder Modal */}
      {showBuilder && (
        <WorkflowBuilder
          open={showBuilder}
          onClose={() => {
            setShowBuilder(false);
            setSelectedTemplate(null);
          }}
          template={selectedTemplate}
          onSave={() => {
            queryClient.invalidateQueries({ queryKey: ["workflows"] });
            setShowBuilder(false);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
}

export default Workflows;
