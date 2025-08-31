
// frontend/src/components/dashboard/QuickActions.tsx
import React from "react";
import {
  PlusIcon,
  CogIcon,
  ChatBubbleLeftRightIcon as ChatIcon,
} from "@heroicons/react/24/outline";

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
