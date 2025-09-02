"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Mail,
  Calendar,
  FileText,
  MessageSquare,
  Clock,
  Zap,
  Mouse,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface WorkflowBuilderProps {
  workflow?: any;
  onClose: () => void;
}

const triggerTypes = [
  {
    value: "manual",
    label: "Manual",
    icon: Mouse,
    description: "Trigger manually",
  },
  {
    value: "schedule",
    label: "Schedule",
    icon: Clock,
    description: "Run on a schedule",
  },
  {
    value: "webhook",
    label: "Webhook",
    icon: Zap,
    description: "Trigger via webhook",
  },
];

const actionTypes = [
  {
    value: "send_email",
    label: "Send Email",
    icon: Mail,
    category: "Communication",
  },
  {
    value: "create_calendar_event",
    label: "Create Event",
    icon: Calendar,
    category: "Calendar",
  },
  {
    value: "send_slack_message",
    label: "Send Slack Message",
    icon: MessageSquare,
    category: "Communication",
  },
  {
    value: "create_notion_page",
    label: "Create Notion Page",
    icon: FileText,
    category: "Documentation",
  },
  {
    value: "search_emails",
    label: "Search Emails",
    icon: Mail,
    category: "Search",
  },
  { value: "wait", label: "Wait", icon: Clock, category: "Control" },
  { value: "condition", label: "Condition", icon: Zap, category: "Control" },
];

export default function WorkflowBuilder({
  workflow,
  onClose,
}: WorkflowBuilderProps) {
  const { toast } = useToast();
  const [name, setName] = useState(workflow?.name || "");
  const [description, setDescription] = useState(workflow?.description || "");
  const [trigger, setTrigger] = useState(
    workflow?.trigger || { type: "manual" }
  );
  const [actions, setActions] = useState(workflow?.actions || []);
  const [expandedActions, setExpandedActions] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const handleAddAction = (type: string) => {
    const action = {
      type,
      params: getDefaultParams(type),
      stopOnError: false,
    };
    setActions([...actions, action]);
    setExpandedActions([...expandedActions, actions.length]);
  };

  const getDefaultParams = (type: string) => {
    switch (type) {
      case "send_email":
        return { to: "", subject: "", body: "" };
      case "create_calendar_event":
        return { summary: "", start: "", end: "", description: "" };
      case "send_slack_message":
        return { channel: "", text: "" };
      case "create_notion_page":
        return { title: "", content: "" };
      case "search_emails":
        return { query: "", maxResults: 10 };
      case "wait":
        return { seconds: 5 };
      case "condition":
        return { variable: "", operator: "equals", value: "" };
      default:
        return {};
    }
  };

  const handleUpdateAction = (index: number, updates: any) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    setActions(newActions);
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_: any, i: number) => i !== index));
    setExpandedActions(
      expandedActions
        .filter((i) => i !== index)
        .map((i) => (i > index ? i - 1 : i))
    );
  };

  const toggleActionExpanded = (index: number) => {
    if (expandedActions.includes(index)) {
      setExpandedActions(expandedActions.filter((i) => i !== index));
    } else {
      setExpandedActions([...expandedActions, index]);
    }
  };

  const handleSave = async () => {
    if (!name) {
      toast({
        title: "Error",
        description: "Workflow name is required",
        variant: "destructive",
      });
      return;
    }

    if (actions.length === 0) {
      toast({
        title: "Error",
        description: "Add at least one action to the workflow",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const data = {
        name,
        description,
        trigger,
        actions,
      };

      if (workflow) {
        await apiClient.updateWorkflow(workflow.id, data);
        toast({
          title: "Workflow Updated",
          description: "Your workflow has been updated successfully",
        });
      } else {
        await apiClient.createWorkflow(data);
        toast({
          title: "Workflow Created",
          description: "Your workflow has been created successfully",
        });
      }

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save workflow",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderActionParams = (action: any, index: number) => {
    const ActionIcon =
      actionTypes.find((a) => a.value === action.type)?.icon || Zap;

    return (
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleActionExpanded(index)}
        >
          <div className="flex items-center gap-3">
            <ActionIcon className="w-5 h-5 text-blue-400" />
            <span className="font-medium">
              {actionTypes.find((a) => a.value === action.type)?.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveAction(index);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            {expandedActions.includes(index) ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>

        {expandedActions.includes(index) && (
          <div className="mt-4 space-y-3">
            {Object.entries(action.params).map(([key, value]) => (
              <div key={key}>
                <Label
                  htmlFor={`${index}-${key}`}
                  className="text-xs text-gray-400"
                >
                  {key
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </Label>
                <Input
                  id={`${index}-${key}`}
                  value={value as string}
                  onChange={(e) =>
                    handleUpdateAction(index, {
                      params: { ...action.params, [key]: e.target.value },
                    })
                  }
                  className="mt-1 bg-gray-700 border-gray-600"
                  placeholder={`Enter ${key}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onClose}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">
          {workflow ? "Edit Workflow" : "Create Workflow"}
        </h2>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Basic Info */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Workflow Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Daily Email Summary"
                className="mt-1 bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this workflow do?"
                className="mt-1 bg-gray-800 border-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Trigger */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4">Trigger</h3>
          <div className="grid grid-cols-3 gap-3">
            {triggerTypes.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  onClick={() => setTrigger({ type: t.value })}
                  className={`p-4 rounded-lg border transition ${
                    trigger.type === t.value
                      ? "bg-blue-600 border-blue-500"
                      : "bg-gray-800 border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{t.description}</p>
                </button>
              );
            })}
          </div>

          {trigger.type === "schedule" && (
            <div className="mt-4">
              <Label htmlFor="cron">Cron Expression</Label>
              <Input
                id="cron"
                value={trigger.cron || ""}
                onChange={(e) =>
                  setTrigger({ ...trigger, cron: e.target.value })
                }
                placeholder="e.g., 0 9 * * * (daily at 9 AM)"
                className="mt-1 bg-gray-800 border-gray-700"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4">Actions</h3>

          {actions.map((action: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {renderActionParams(action, index)}
            </motion.div>
          ))}

          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-3">Add an action:</p>
            <div className="grid grid-cols-2 gap-2">
              {actionTypes.map((actionType) => {
                const Icon = actionType.icon;
                return (
                  <Button
                    key={actionType.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddAction(actionType.value)}
                    className="justify-start"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {actionType.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {workflow ? "Update Workflow" : "Create Workflow"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
