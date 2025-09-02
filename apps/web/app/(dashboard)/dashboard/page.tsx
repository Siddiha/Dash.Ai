"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ChatInterface from "@/components/chat/ChatInterface";
import IntegrationPanel from "@/components/integrations/IntegrationPanel";
import WorkflowList from "@/components/workflows/WorkflowList";
import {
  MessageSquare,
  Workflow,
  Settings,
  Plus,
  Search,
  Bell,
  ChevronRight,
} from "lucide-react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [greeting, setGreeting] = useState("");
  const [activeView, setActiveView] = useState("chat");
  const [showIntegrations, setShowIntegrations] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const hour = new Date().getHours();
    const name = session?.user?.name?.split(" ")[0] || "there";

    if (hour < 12) setGreeting(`Good morning, ${name}`);
    else if (hour < 18) setGreeting(`Good afternoon, ${name}`);
    else setGreeting(`Good evening, ${name}`);
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold">Slashy</span>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <button
              onClick={() => setActiveView("chat")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                activeView === "chat"
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              Chat
            </button>
            <button
              onClick={() => setActiveView("workflows")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition mt-2 ${
                activeView === "workflows"
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Workflow className="w-5 h-5" />
              Workflows
            </button>
            <button
              onClick={() => setActiveView("integrations")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition mt-2 ${
                activeView === "integrations"
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Settings className="w-5 h-5" />
              Integrations
            </button>
          </nav>

          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback>
                  {session?.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-gray-400">{session?.user?.email}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b border-gray-800 p-6">
            <div className="flex justify-between items-center">
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold"
                >
                  {greeting}
                </motion.h1>
                <p className="text-gray-400 mt-1">
                  How can Slashy help you today?
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowIntegrations(!showIntegrations)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Connect Apps
                </Button>
                <button className="p-2 hover:bg-gray-800 rounded-lg transition">
                  <Bell className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-4">
              {[
                "Prepare for meeting",
                "Check emails",
                "Create document",
                "Review tasks",
              ].map((action) => (
                <Button
                  key={action}
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                >
                  {action}
                </Button>
              ))}
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {activeView === "chat" && <ChatInterface />}
            {activeView === "workflows" && <WorkflowList />}
            {activeView === "integrations" && <IntegrationPanel />}
          </div>
        </main>

        {/* Integration Sidebar */}
        {showIntegrations && (
          <motion.aside
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            className="w-80 border-l border-gray-800 p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Connect your tools</h2>
              <button
                onClick={() => setShowIntegrations(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <IntegrationPanel compact />
          </motion.aside>
        )}
      </div>
    </div>
  );
}
