import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaperAirplaneIcon, 
  MicrophoneIcon, 
  PaperClipIcon,
  StarIcon,
  CalendarIcon,
  EnvelopeIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ChatInterface = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const { socket } = useSocket();
  const { user } = useAuth();

  const quickActions = [
    {
      icon: CalendarIcon,
      label: 'Schedule Meeting',
      prompt: 'Schedule a meeting for next week',
      color: 'bg-blue-500'
    },
    {
      icon: EnvelopeIcon,
      label: 'Draft Email',
      prompt: 'Help me draft a professional email',
      color: 'bg-green-500'
    },
    {
      icon: DocumentIcon,
      label: 'Create Document',
      prompt: 'Create a new document in Google Drive',
      color: 'bg-purple-500'
    }
  ];

  useEffect(() => {
    if (!socket) return;

    // Listen for AI responses
    socket.on('ai_response', (data) => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: data.message,
        type: 'assistant',
        timestamp: new Date(data.timestamp),
        metadata: data.metadata
      }]);
    });

    // Listen for errors
    socket.on('error', (data) => {
      setIsTyping(false);
      toast.error(data.message);
    });

    // Listen for typing indicator
    socket.on('ai_typing', () => {
      setIsTyping(true);
    });

    return () => {
      socket.off('ai_response');
      socket.off('error');
      socket.off('ai_typing');
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // Load conversation history
    loadConversationHistory();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversationHistory = async () => {
    try {
      const response = await fetch('/api/chat/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        console.log('No chat history available yet');
        return;
      }
      
      if (response.ok) {
        const history = await response.json();
        setMessages(history.messages || []);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const sendMessage = async (messageText = message) => {
    if (!messageText.trim() || !socket) return;

    const userMessage = {
      id: Date.now(),
      content: messageText,
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    // Send message to server
    socket.emit('chat_message', {
      message: messageText,
      conversationId: 'default' // You can implement multiple conversations
    });

    // Generate suggestions based on context
    generateSuggestions(messageText);
  };

  const generateSuggestions = async (currentMessage) => {
    try {
      const response = await fetch('/api/chat/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: currentMessage })
      });

      if (response.ok) {
        const { suggestions } = await response.json();
        setSuggestions(suggestions || []);
      } else {
        console.log('No suggestions available yet');
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickAction = (prompt) => {
    sendMessage(prompt);
  };

  const MessageBubble = ({ message }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
        message.type === 'user' 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-700 text-gray-100 border border-gray-600'
      }`}>
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        <div className={`text-xs mt-2 ${
          message.type === 'user' ? 'text-blue-200' : 'text-gray-400'
        }`}>
          {message.timestamp.toLocaleTimeString()}
        </div>
        
        {/* Action buttons for AI responses */}
        {message.type === 'assistant' && message.metadata?.requiresIntegration && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors">
              Connect {message.metadata.integrationNeeded}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );

  const TypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-start mb-4"
    >
      <div className="bg-gray-700 border border-gray-600 px-4 py-3 rounded-2xl">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Chat Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <StarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">AI Assistant</h1>
            <p className="text-sm text-gray-400">Ready to help with your tasks</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-green-400 flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
            Online
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                              <StarIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Good evening, {user?.name || 'there'}!
            </h2>
            <p className="text-gray-400 mb-6">
              How can I help you manage your productivity today?
            </p>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
              {quickActions.map((action, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleQuickAction(action.prompt)}
                  className={`${action.color} hover:opacity-80 transition-opacity p-4 rounded-xl text-left group`}
                >
                  <action.icon className="w-6 h-6 text-white mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-white font-medium text-sm">{action.label}</div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isTyping && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 py-2"
          >
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => sendMessage(suggestion)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex items-center space-x-3 bg-gray-700 rounded-xl p-2">
          <button className="text-gray-400 hover:text-gray-300 transition-colors">
            <PaperClipIcon className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full bg-transparent text-white placeholder-gray-400 resize-none outline-none max-h-32 min-h-[20px]"
              rows="1"
              style={{
                height: 'auto',
                minHeight: '20px',
                maxHeight: '128px'
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
              }}
            />
          </div>
          
          <button className="text-gray-400 hover:text-gray-300 transition-colors">
            <MicrophoneIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => sendMessage()}
            disabled={!message.trim() || isTyping}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
        
        <div className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send, Shift + Enter for new line
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
