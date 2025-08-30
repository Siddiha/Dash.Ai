
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


