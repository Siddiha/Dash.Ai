// frontend/src/pages/Landing.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  BoltIcon,
  ShieldCheckIcon,
  CogIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { authService } from "../services/auth";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const integrations = [
  { name: "Gmail", icon: "📧", color: "from-red-500 to-red-600" },
  { name: "Calendar", icon: "📅", color: "from-blue-500 to-blue-600" },
  { name: "Notion", icon: "📝", color: "from-gray-800 to-gray-900" },
  { name: "Slack", icon: "💬", color: "from-green-500 to-green-600" },
  { name: "HubSpot", icon: "🎯", color: "from-orange-500 to-orange-600" },
  { name: "Linear", icon: "📋", color: "from-purple-500 to-purple-600" },
  { name: "Drive", icon: "💾", color: "from-yellow-500 to-yellow-600" },
  { name: "Sheets", icon: "📊", color: "from-green-600 to-green-700" },
];

const features = [
  {
    title: "AI-Powered Task Management",
    description:
      "Let AI automatically organize your tasks, prioritize your schedule, and suggest optimal workflows.",
    icon: BoltIcon,
  },
  {
    title: "Smart Email Assistant",
    description:
      "AI reads your emails, drafts responses, schedules meetings, and extracts action items automatically.",
    icon: CogIcon,
  },
  {
    title: "Unified Calendar Management",
    description:
      "Coordinate across multiple calendars, find optimal meeting times, and schedule with natural language.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Cross-Platform Automation",
    description:
      "Create workflows that span multiple apps. When X happens in Gmail, do Y in Slack and Z in Notion.",
    icon: CheckCircleIcon,
  },
  {
    title: "Intelligent Chat Interface",
    description:
      "Chat with your data across all platforms. Ask questions, give commands, get insights instantly.",
    icon: CogIcon,
  },
];

const workflows = [
  {
    title: "Email to Task Creation",
    description:
      "Automatically convert important emails into actionable tasks in your project management tools.",
    steps: [
      "Email arrives",
      "AI analyzes content",
      "Creates task in Linear/Notion",
      "Notifies team",
    ],
  },
  {
    title: "Meeting Preparation",
    description:
      "AI prepares meeting briefings by gathering relevant emails, docs, and previous discussions.",
    steps: [
      "Meeting scheduled",
      "Gather context",
      "Create briefing doc",
      "Share with attendees",
    ],
  },
  {
    title: "Sales Lead Processing",
    description:
      "New leads are automatically researched, qualified, and added to your CRM with context.",
    steps: [
      "Lead captured",
      "Research company",
      "Create HubSpot contact",
      "Schedule follow-up",
    ],
  },
];

const pricing = [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect for individuals getting started",
    features: [
      "3 integrations",
      "100 AI actions/month",
      "Basic workflows",
      "Email support",
    ],
  },
  {
    name: "Professional",
    price: "$29/month",
    description: "For power users and small teams",
    features: [
      "Unlimited integrations",
      "10,000 AI actions/month",
      "Advanced workflows",
      "Priority support",
      "Custom automations",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large teams and organizations",
    features: [
      "Everything in Professional",
      "Unlimited AI actions",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
    ],
  },
];

function Landing() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { authUrl } = (await authService.googleAuth()) as {
        authUrl: string;
      };
      window.location.href = authUrl;
    } catch (error) {
      toast.error("Failed to start authentication");
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      authService
        .googleCallback(code)
        .then((response: any) => {
          const { token, user } = response;
          login(token, user);
          navigate("/dashboard");
          toast.success("Successfully logged in!");
        })
        .catch(() => {
          toast.error("Authentication failed");
        });
    }
  }, [login, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="relative z-10 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Dash.AI
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="bg-white text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Get Started"}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight">
              The AI for
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent block">
                Everything
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Dash.AI connects to all your tools to complete entire tasks.
              Manage emails, schedule meetings, update databases, and coordinate
              your team - all through natural conversation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 flex items-center space-x-2"
              >
                <span>{isLoading ? "Starting..." : "Start Now"}</span>
                <ArrowRightIcon className="w-5 h-5" />
              </button>
              <button className="text-white border border-white/30 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition-colors">
                Watch Demo
              </button>
            </div>
          </motion.div>

          {/* Integration Icons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="flex flex-wrap justify-center items-center gap-6 mb-20"
          >
            {integrations.map((integration, index) => (
              <motion.div
                key={integration.name}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className={`bg-gradient-to-r ${integration.color} p-4 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:scale-110`}
              >
                <span className="text-3xl">{integration.icon}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              AI That Actually Gets Work Done
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Unlike simple chatbots, Dash.AI takes action across your entire
              workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-all"
              >
                <feature.icon className="w-12 h-12 text-blue-400 mb-6" />
                <h3 className="text-xl font-semibold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Examples */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Automated Workflows
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Build powerful automation sequences that connect your favorite
              tools
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {workflows.map((workflow, index) => (
              <motion.div
                key={workflow.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.3 }}
                className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-white/10 p-8 rounded-2xl"
              >
                <h3 className="text-xl font-semibold text-white mb-4">
                  {workflow.title}
                </h3>
                <p className="text-gray-300 mb-6">{workflow.description}</p>
                <div className="space-y-3">
                  {workflow.steps.map((step, stepIndex) => (
                    <div
                      key={stepIndex}
                      className="flex items-center space-x-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                        {stepIndex + 1}
                      </div>
                      <span className="text-sm text-gray-300">{step}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Start free, scale as you grow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className={`relative bg-white/5 backdrop-blur-sm border rounded-2xl p-8 ${
                  plan.popular
                    ? "border-blue-400 bg-gradient-to-br from-blue-900/20 to-purple-900/20"
                    : "border-white/10"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="text-4xl font-bold text-white mb-2">
                    {plan.price}
                  </div>
                  <p className="text-gray-300">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-center space-x-3"
                    >
                      <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleGoogleLogin}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
                      : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                  }`}
                >
                  Get Started
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who've automated their busywork
              with Dash.AI
            </p>
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-12 py-4 rounded-lg text-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50"
            >
              {isLoading ? "Starting..." : "Start Free Today"}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Dash.AI
              </span>
              <p className="text-gray-400 mt-2">
                The AI assistant for everything
              </p>
            </div>
            <div className="flex space-x-6 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Support
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Docs
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-gray-400">
            <p>&copy; 2024 Dash.AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
