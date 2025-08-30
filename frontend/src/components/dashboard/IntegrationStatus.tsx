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
