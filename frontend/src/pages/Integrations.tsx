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

