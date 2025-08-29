// frontend/src/pages/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  MailIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  TrendingUpIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/outline";
import { api } from "../services/api";
import TaskList from "../components/dashboard/TaskList";
import QuickActions from "../components/dashboard/QuickActions";
import IntegrationStatus from "../components/dashboard/IntegrationStatus";

interface DashboardData {
  tasks: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  emails: {
    unread: number;
    total: number;
    recent: Array<{
      id: string;
      subject: string;
      from: string;
      date: string;
      snippet: string;
    }>;
  };
  calendar: {
    upcomingEvents: Array<{
      id: string;
      summary: string;
      start: string;
      end: string;
    }>;
    todayEvents: number;
  };
  integrations: {
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

function Dashboard() {
  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await api.get("/dashboard");
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const stats = [
    {
      name: "Pending Tasks",
      value: dashboardData?.tasks.pending || 0,
      icon: ClockIcon,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      name: "Unread Emails",
      value: dashboardData?.emails.unread || 0,
      icon: MailIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "Today's Events",
      value: dashboardData?.calendar.todayEvents || 0,
      icon: CalendarIcon,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "Completed Tasks",
      value: dashboardData?.tasks.completed || 0,
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
        <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-400" />
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
              {dashboardData?.emails.recent?.slice(0, 5).map((email) => (
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
            {(!dashboardData?.emails.recent ||
              dashboardData.emails.recent.length === 0) && (
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
              {dashboardData?.calendar.upcomingEvents
                ?.slice(0, 5)
                .map((event) => (
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
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
            </div>
            {(!dashboardData?.calendar.upcomingEvents ||
              dashboardData.calendar.upcomingEvents.length === 0) && (
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

// frontend/src/components/chat/ChatInterface.tsx
import React, { useState, useRef, useEffect } from "react";
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from "@heroicons/react/outline";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../services/api";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

interface ChatInterfaceProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

function ChatInterface({ open, setOpen }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    // Add user message immediately
    const tempUserMessage: Message = {
      id: Date.now().toString(),
      role: "USER",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await api.post("/chat/message", {
        message: userMessage,
        sessionId: currentSessionId,
      });

      const { message: aiMessage, sessionId } = response.data;

      setCurrentSessionId(sessionId);
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ASSISTANT",
        content: "Sorry, I encountered an error. Please try again.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedPrompts = [
    "Schedule a meeting with the team for next week",
    "Check my unread emails and summarize them",
    "Create a task for the quarterly report",
    "What's on my calendar today?",
    "Send a follow-up email to recent prospects",
  ];

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 overflow-hidden z-50"
        onClose={setOpen}
      >
        <div className="absolute inset-0 overflow-hidden">
          <Dialog.Overlay className="absolute inset-0 bg-black bg-opacity-30" />

          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex sm:pl-16">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-500"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-500"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <div className="w-screen max-w-md">
                <div className="h-full flex flex-col bg-white shadow-xl">
                  {/* Header */}
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <SparklesIcon className="h-6 w-6" />
                        <h2 className="text-lg font-semibold">
                          Dash.AI Assistant
                        </h2>
                      </div>
                      <button
                        type="button"
                        className="text-white hover:text-gray-200 transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        <XIcon className="h-6 w-6" />
                      </button>
                    </div>
                    <p className="text-blue-100 text-sm mt-1">
                      Ask me anything about your connected apps
                    </p>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center py-8">
                        <SparklesIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Welcome to Dash.AI!
                        </h3>
                        <p className="text-gray-500 mb-6">
                          I can help you manage tasks, emails, calendar events,
                          and more across all your connected apps.
                        </p>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 font-medium">
                            Try asking:
                          </p>
                          {suggestedPrompts.slice(0, 3).map((prompt, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestedPrompt(prompt)}
                              className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-md transition-colors"
                            >
                              "{prompt}"
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <AnimatePresence>
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className={`flex ${
                            message.role === "USER"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.role === "USER"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            {message.role === "ASSISTANT" ? (
                              <ReactMarkdown className="prose prose-sm max-w-none">
                                {message.content}
                              </ReactMarkdown>
                            ) : (
                              <p className="text-sm">{message.content}</p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg max-w-xs">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                              <div
                                className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">
                              Thinking...
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Form */}
                  <div className="border-t border-gray-200 px-6 py-4">
                    <form onSubmit={sendMessage} className="flex space-x-3">
                      <div className="flex-1">
                        <input
                          ref={inputRef}
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder="Ask me anything..."
                          disabled={isLoading}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PaperAirplaneIcon className="h-4 w-4 transform rotate-90" />
                      </button>
                    </form>

                    {messages.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {suggestedPrompts.slice(0, 2).map((prompt, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestedPrompt(prompt)}
                            disabled={isLoading}
                            className="text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded border border-gray-200 transition-colors disabled:opacity-50"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default ChatInterface;
