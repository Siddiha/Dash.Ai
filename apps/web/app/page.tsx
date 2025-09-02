"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  Calendar,
  Mail,
  FileText,
  MessageSquare,
  Workflow,
  Search,
  CheckCircle,
} from "lucide-react";

const integrations = [
  { name: "Gmail", icon: "📧" },
  { name: "Calendar", icon: "📅" },
  { name: "Slack", icon: "💬" },
  { name: "Notion", icon: "📝" },
  { name: "Drive", icon: "📁" },
  { name: "Linear", icon: "📊" },
  { name: "Hubspot", icon: "🎯" },
  { name: "Dropbox", icon: "📦" },
];

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 gradient-radial opacity-30" />
      <div className="fixed inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full filter blur-[128px] opacity-20" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full filter blur-[128px] opacity-20" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-6 lg:px-12">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold">Slashy</span>
        </div>

        <div className="hidden md:flex gap-8">
          <Link
            href="/pricing"
            className="text-gray-300 hover:text-white transition"
          >
            Pricing
          </Link>
          <Link
            href="/use-cases"
            className="text-gray-300 hover:text-white transition"
          >
            Use Cases
          </Link>
          <Link
            href="/enterprise"
            className="text-gray-300 hover:text-white transition"
          >
            Enterprise
          </Link>
        </div>

        <div className="flex gap-4">
          <Button variant="outline" className="hidden sm:flex">
            Book a demo
          </Button>
          <Button
            onClick={() => {
              setIsLoading(true);
              router.push("/login");
            }}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Start now"}
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <span className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-4 py-2 rounded-full text-sm">
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            Backed by Y Combinator
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent"
        >
          The AI for Work
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto"
        >
          Slashy connects to all your tools to complete entire tasks.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button
            size="lg"
            className="mb-8 bg-white text-black hover:bg-gray-200"
            onClick={() => router.push("/login")}
          >
            <Mail className="mr-2 h-5 w-5" />
            Start now with Google
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          {["Meetings", "Workflow", "Search", "Gmail", "Notion", "Leads"].map(
            (tag, i) => (
              <span
                key={tag}
                className="px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-full text-sm hover:border-gray-700 transition"
              >
                {tag}
              </span>
            )
          )}
        </motion.div>
      </div>

      {/* Demo Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="relative z-10 max-w-4xl mx-auto px-6 py-10"
      >
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <div className="w-2 h-2 bg-green-500 rounded-full" />
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <MessageSquare className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-gray-300 mb-2">
                  Can you prepare me for my next meeting?
                </p>
                <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
                  <p className="text-sm text-gray-400">Thinking...</p>
                  <p className="text-sm text-gray-300">
                    I'll help you prepare for your next meeting! Let me first
                    check your calendar to see what's coming up, and then gather
                    any relevant context and materials.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 ml-11">
              <Button size="sm" variant="secondary" className="text-xs">
                <Calendar className="mr-1 h-3 w-3" />
                Find Events
              </Button>
              <Button size="sm" variant="secondary" className="text-xs">
                <Search className="mr-1 h-3 w-3" />
                Search Pages
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Features Grid */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold text-center mb-12"
        >
          Automate your entire workflow
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Meeting Preparation",
              description:
                "Research attendees, gather documents, and create agendas automatically",
              icon: Calendar,
            },
            {
              title: "Email Management",
              description:
                "Draft responses, schedule sends, and manage your inbox with AI",
              icon: Mail,
            },
            {
              title: "Document Creation",
              description:
                "Generate reports, proposals, and summaries from your data",
              icon: FileText,
            },
            {
              title: "Task Automation",
              description:
                "Create workflows that run automatically based on triggers",
              icon: Workflow,
            },
            {
              title: "Smart Search",
              description:
                "Find information across all your connected tools instantly",
              icon: Search,
            },
            {
              title: "Lead Management",
              description:
                "Qualify leads, send follow-ups, and update your CRM",
              icon: CheckCircle,
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-gray-900/30 backdrop-blur border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition"
            >
              <feature.icon className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Integrations Section */}
      <div className="relative z-10 text-center py-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold mb-10"
        >
          Integrates with all your apps
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap gap-6 justify-center max-w-3xl mx-auto"
        >
          {integrations.map((app, i) => (
            <motion.div
              key={app.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg hover:border-gray-700 transition"
            >
              <span className="text-2xl">{app.icon}</span>
              <span className="text-sm">{app.name}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur border border-gray-800 rounded-2xl p-12"
        >
          <h2 className="text-3xl font-bold mb-4">
            Ready to transform your workflow?
          </h2>
          <p className="text-gray-400 mb-8">
            Join thousands of teams automating their work with AI
          </p>
          <Button
            size="lg"
            className="bg-white text-black hover:bg-gray-200"
            onClick={() => router.push("/login")}
          >
            Get started free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
