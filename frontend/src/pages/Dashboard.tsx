// frontend/src/pages/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UserGroupIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { api, apiResponse } from "../services/api";
import { DashboardData } from "../types/dashboard";
import TaskList from "../components/dashboard/TaskList";
import QuickActions from "../components/dashboard/QuickActions";
import IntegrationStatus from "../components/dashboard/IntegrationStatus";

function Dashboard() {
  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async (): Promise<DashboardData> => {
      const response = await api.get<DashboardData>("/dashboard");
      return apiResponse(response);
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const stats = [
    {
      name: "Pending Tasks",
      value: dashboardData?.tasks?.pending || 0,
      icon: ClockIcon,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      name: "Unread Emails",
      value: dashboardData?.emails?.unread || 0,
      icon: ChartBarIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "Today's Events",
      value: dashboardData?.calendar?.todayEvents || 0,
      icon: UserGroupIcon,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "Completed Tasks",
      value: dashboardData?.tasks?.completed || 0,
      icon: CheckCircleIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Error loading dashboard
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Please try refreshing the page
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening across your connected apps.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.bgColor} p-3 rounded-md`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Tasks and Quick Actions */}
        <div className="lg:col-span-2 space-y-8">
          <TaskList tasks={dashboardData?.tasks} />
          <QuickActions />
        </div>

        {/* Right Column - Integrations and Recent Activity */}
        <div className="space-y-8">
          <IntegrationStatus integrations={dashboardData?.integrations} />

          {/* Recent Emails */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Recent Emails
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {(dashboardData as DashboardData)?.emails?.recent
                ?.slice(0, 5)
                .map((email: any) => (
                  <div key={email.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {email.subject}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {email.from}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {email.snippet}
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0 text-xs text-gray-400">
                        {new Date(email.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            {(!(dashboardData as DashboardData)?.emails?.recent ||
              (dashboardData as DashboardData)?.emails?.recent?.length ===
                0) && (
              <div className="px-6 py-4 text-center text-gray-500">
                No recent emails
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Upcoming Events
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {(dashboardData as DashboardData)?.calendar?.upcomingEvents
                ?.slice(0, 5)
                .map((event: any) => (
                  <div key={event.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {event.summary}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.start).toLocaleString()}
                        </p>
                      </div>
                      <UserGroupIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
            </div>
            {(!(dashboardData as DashboardData)?.calendar?.upcomingEvents ||
              (dashboardData as DashboardData)?.calendar?.upcomingEvents
                ?.length === 0) && (
              <div className="px-6 py-4 text-center text-gray-500">
                No upcoming events
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
