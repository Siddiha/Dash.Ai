"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ChatInterface from "@/components/chat/ChatInterface";
import IntegrationPanel from "@/components/integrations/IntegrationPanel";
import { Button } from "@/components/ui/button";
import {
  Plus,
  MessageSquare,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function ChatPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState([
    { id: "1", title: "Meeting preparation", time: "2 hours ago" },
    { id: "2", title: "Email drafts", time: "Yesterday" },
    { id: "3", title: "Project planning", time: "2 days ago" },
  ]);

  return (
    <div className="h-screen bg-black text-white flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-300 border-r border-gray-800 overflow-hidden`}
      >
        <div className="p-4">
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 mb-4"
            onClick={() => {
              // Start new conversation
              window.location.reload();
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>

          <div className="space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
              Recent Conversations
            </p>
            {conversations.map((conv) => (
              <button
                key={conv.id}
                className="w-full flex items-start gap-3 p-2 hover:bg-gray-900 rounded-lg transition text-left"
              >
                <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{conv.title}</p>
                  <p className="text-xs text-gray-500">{conv.time}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-gray-800 rounded"
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
            <div>
              <h1 className="text-xl font-semibold">AI Assistant</h1>
              <p className="text-sm text-gray-400">Always here to help</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push("/workflows")}
            >
              Workflows
            </Button>
            <Button size="sm" onClick={() => router.push("/integrations")}>
              Integrations
            </Button>
            <button className="p-2 hover:bg-gray-800 rounded-lg transition">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Compact integrations quick-connect */}
        <div className="px-6 py-3 border-b border-gray-900/60">
          <p className="text-xs text-gray-400 mb-2">
            Connect your tools to Dash
          </p>
          <IntegrationPanel compact />
        </div>

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
