// frontend/src/components/chat/MessageBubble.tsx
import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

interface MessageBubbleProps {
  message: Message;
  isLast?: boolean;
}

function MessageBubble({ message, isLast = false }: MessageBubbleProps) {
  const isUser = message.role === "USER";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900"
        }`}
      >
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <ReactMarkdown className="prose prose-sm max-w-none">
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </motion.div>
  );
}

export default MessageBubble;



