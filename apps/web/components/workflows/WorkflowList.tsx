"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Workflow,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Zap,
  Calendar,
  Mouse,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import WorkflowBuilder from "./WorkflowBuilder";

interface WorkflowItem {
  id: string;
  name: string;
  description?: string;
  trigger: any;
  actions: any[];
  isActive: boolean;
  lastRun?: Date;
  createdAt: Date;
  _count: {
    executions: number;
  };
}

export default function WorkflowList() {
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItem | null>(
    null
  );
  const [showBuilder, setShowBuilder] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const data = await apiClient.getWorkflows();
      setWorkflows(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch workflows",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWorkflow = async (workflow: WorkflowItem) => {
    try {
      await apiClient.updateWorkflow(workflow.id, {
        isActive: !workflow.isActive,
      });

      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === workflow.id ? { ...w, isActive: !w.isActive } : w
        )
      );

      toast({
        title: workflow.isActive ? "Workflow Paused" : "Workflow Activated",
        description: `${workflow.name} has been ${
          workflow.isActive ? "paused" : "activated"
        }`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle workflow",
        variant: "destructive",
      });
    }
  };

  const handleExecuteWorkflow = async (workflow: WorkflowItem) => {
    try {
      await apiClient.executeWorkflow(workflow.id);

      toast({
        title: "Workflow Executed",
        description: `${workflow.name} has been triggered manually`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute workflow",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWorkflow = async (workflow: WorkflowItem) => {
    if (!confirm(`Are you sure you want to delete "${workflow.name}"?`)) {
      return;
    }

    try {
      await apiClient.deleteWorkflow(workflow.id);
      setWorkflows((prev) => prev.filter((w) => w.id !== workflow.id));

      toast({
        title: "Workflow Deleted",
        description: `${workflow.name} has been deleted`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete workflow",
        variant: "destructive",
      });
    }
  };

  const getTriggerIcon = (trigger: any) => {
    switch (trigger.type) {
      case "schedule":
        return Calendar;
      case "webhook":
        return Zap;
      case "manual":
        return Mouse;
      default:
        return Clock;
    }
  };

  const getTriggerLabel = (trigger: any) => {
    switch (trigger.type) {
      case "schedule":
        return `Runs ${trigger.cron || "on schedule"}`;
      case "webhook":
        return "Webhook trigger";
      case "manual":
        return "Manual trigger";
      default:
        return "Unknown trigger";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  if (showBuilder) {
    return (
      <WorkflowBuilder
        workflow={selectedWorkflow}
        onClose={() => {
          setShowBuilder(false);
          setSelectedWorkflow(null);
          fetchWorkflows();
        }}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Workflows</h2>
          <p className="text-gray-400">
            Automate repetitive tasks with workflows
          </p>
        </div>
        <Button
          onClick={() => setShowBuilder(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {workflows.length === 0 ? (
        <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
          <Workflow className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
          <p className="text-gray-400 mb-6">
            Create your first workflow to automate tasks
          </p>
          <Button onClick={() => setShowBuilder(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {workflows.map((workflow, idx) => {
            const TriggerIcon = getTriggerIcon(workflow.trigger);
            return (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        workflow.isActive ? "bg-blue-600" : "bg-gray-700"
                      }`}
                    >
                      <Workflow className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">
                        {workflow.name}
                      </h3>
                      {workflow.description && (
                        <p className="text-sm text-gray-400 mb-2">
                          {workflow.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <TriggerIcon className="w-3 h-3" />
                          {getTriggerLabel(workflow.trigger)}
                        </span>
                        <span>{workflow.actions.length} actions</span>
                        <span>{workflow._count.executions} runs</span>
                        {workflow.lastRun && (
                          <span>
                            Last run:{" "}
                            {new Date(workflow.lastRun).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleWorkflow(workflow)}
                    >
                      {workflow.isActive ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleExecuteWorkflow(workflow)}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedWorkflow(workflow);
                        setShowBuilder(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteWorkflow(workflow)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  {workflow.actions.slice(0, 3).map((action, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1 bg-gray-800 rounded-full text-xs"
                    >
                      {action.type.replace(/_/g, " ")}
                    </div>
                  ))}
                  {workflow.actions.length > 3 && (
                    <div className="px-3 py-1 bg-gray-800 rounded-full text-xs">
                      +{workflow.actions.length - 3} more
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
