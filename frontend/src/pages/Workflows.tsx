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
import { api, apiResponse } from "../services/api";
import { Workflow } from "../types/workflow";
import toast from "react-hot-toast";
// import WorkflowBuilder from "../components/workflows/WorkflowBuilder";

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

  const { data: workflows, isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: async (): Promise<Workflow[]> => {
      const response = await api.get<Workflow[]>("/workflows");
      return apiResponse(response);
    },
  });

  const toggleWorkflowMutation = useMutation<
    void,
    Error,
    { id: string; isActive: boolean }
  >({
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

  const deleteWorkflowMutation = useMutation<
    void,
    Error,
    string
  >({
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
    active:
      workflows?.filter((w: Workflow) => w.isActive).length ||
      0,
    executions:
      workflows?.reduce(
        (sum: number, w: Workflow) => sum + (w.executions?.length || 0),
        0
      ) || 0,
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
              {workflows.map(
                (workflow: Workflow, index: number) => (
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
                              {workflow.executions.filter(e => e.status === 'COMPLETED').length} successful
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
                            <span>{workflow.executions.filter(e => e.status === 'FAILED').length} failed</span>
                          </div>
                          {workflow.executions.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <ClockIcon className="h-4 w-4" />
                              <span>
                                Last run:{" "}
                                {new Date(
                                  workflow.executions[workflow.executions.length - 1]?.startedAt || ''
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
                          {workflow.trigger.integration} -{" "}
                          {workflow.trigger.type}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium text-gray-700">
                          {workflow.steps.length} action
                          {workflow.steps.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              )}
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
      {/* {showBuilder && (
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
      )} */}
    </div>
  );
}

export default Workflows;
