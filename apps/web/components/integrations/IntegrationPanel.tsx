"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Mail,
  Calendar,
  FileText,
  MessageSquare,
  Database,
  Phone,
  Briefcase,
  Box,
  Check,
  X,
  Loader2,
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  type: string;
  icon: any;
  description: string;
  connected: boolean;
  color: string;
}

const availableIntegrations: Integration[] = [
  {
    id: "gmail",
    name: "Gmail",
    type: "gmail",
    icon: Mail,
    description: "Connect your Gmail account to manage emails",
    connected: false,
    color: "from-red-500 to-red-600",
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    type: "calendar",
    icon: Calendar,
    description: "Sync your calendar and manage events",
    connected: false,
    color: "from-blue-500 to-blue-600",
  },
];

interface IntegrationPanelProps {
  compact?: boolean;
}

export default function IntegrationPanel({
  compact = false,
}: IntegrationPanelProps) {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState(availableIntegrations);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/integrations`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIntegrations((prev) =>
          prev.map((integration) => ({
            ...integration,
            connected: data.some(
              (i: any) => i.type === integration.type && i.isActive
            ),
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch integrations:", error);
    }
  };

  const handleConnect = async (integration: Integration) => {
    setLoading(integration.id);

    try {
      // For Google services, use OAuth flow
      if (integration.type === "gmail" || integration.type === "calendar") {
        const token = localStorage.getItem("token") || "";
        const state = btoa(
          JSON.stringify({ token, service: integration.type })
        );
        window.location.href = `${
          process.env.NEXT_PUBLIC_API_URL
        }/api/integrations/oauth/google?state=${encodeURIComponent(state)}`;
        return;
      }

      // For other services, show coming soon
      toast({
        title: "Coming Soon",
        description: `${integration.name} integration will be available soon!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to connect ${integration.name}`,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    setLoading(integration.id);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/integrations/${integration.type}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        setIntegrations((prev) =>
          prev.map((i) =>
            i.id === integration.id ? { ...i, connected: false } : i
          )
        );
        toast({
          title: "Disconnected",
          description: `${integration.name} has been disconnected`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to disconnect ${integration.name}`,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {integrations.slice(0, 6).map((integration) => {
          const Icon = integration.icon;
          return (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 bg-gradient-to-br ${integration.color} rounded-lg flex items-center justify-center`}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm">{integration.name}</span>
              </div>
              <Button
                size="sm"
                variant={integration.connected ? "secondary" : "default"}
                onClick={() =>
                  integration.connected
                    ? handleDisconnect(integration)
                    : handleConnect(integration)
                }
                disabled={loading === integration.id}
              >
                {loading === integration.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : integration.connected ? (
                  "Connected"
                ) : (
                  "Connect"
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Integrations</h2>
        <p className="text-gray-400">
          Connect your favorite tools to automate your workflow
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration, idx) => {
          const Icon = integration.icon;
          return (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${integration.color} rounded-xl flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {integration.connected && (
                  <Check className="w-5 h-5 text-green-400" />
                )}
              </div>

              <h3 className="font-semibold mb-1">{integration.name}</h3>
              <p className="text-sm text-gray-400 mb-4">
                {integration.description}
              </p>

              <Button
                size="sm"
                variant={integration.connected ? "secondary" : "default"}
                className="w-full"
                onClick={() =>
                  integration.connected
                    ? handleDisconnect(integration)
                    : handleConnect(integration)
                }
                disabled={loading === integration.id}
              >
                {loading === integration.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : integration.connected ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Disconnect
                  </>
                ) : (
                  "Connect"
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
