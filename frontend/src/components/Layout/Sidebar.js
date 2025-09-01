import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  SparklesIcon,
  PuzzlePieceIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon, current: location.pathname === '/chat' },
    { name: 'Integrations', href: '/integrations', icon: PuzzlePieceIcon, current: location.pathname === '/integrations' },
    { name: 'Calendar', href: '/calendar', icon: CalendarIcon, current: location.pathname === '/calendar' },
    { name: 'Documents', href: '/documents', icon: DocumentIcon, current: location.pathname === '/documents' },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, current: location.pathname === '/analytics' },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, current: location.pathname === '/settings' },
  ];

  return (
    <motion.div
      initial={false}
      animate={{ width: isOpen ? 256 : 64 }}
      className="fixed inset-y-0 left-0 z-50 bg-gray-800 border-r border-gray-700"
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center px-4 border-b border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <motion.div
              initial={false}
              animate={{ opacity: isOpen ? 1 : 0, width: isOpen ? 'auto' : 0 }}
              transition={{ duration: 0.2 }}
              className="ml-3 overflow-hidden"
            >
              <h1 className="text-xl font-bold text-white whitespace-nowrap">AI Assistant</h1>
            </motion.div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => (
            <motion.button
              key={item.name}
              onClick={() => navigate(item.href)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`${
                item.current
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              } group flex w-full items-center rounded-lg px-2 py-3 text-sm font-medium transition-colors`}
            >
              <item.icon
                className={`${
                  item.current ? 'text-white' : 'text-gray-400 group-hover:text-white'
                } mr-3 h-5 w-5 flex-shrink-0`}
              />
              <motion.span
                initial={false}
                animate={{ opacity: isOpen ? 1 : 0, width: isOpen ? 'auto' : 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                {item.name}
              </motion.span>
            </motion.button>
          ))}
        </nav>

        {/* User section at bottom */}
        <div className="border-t border-gray-700 p-4">
          <motion.div
            initial={false}
            animate={{ opacity: isOpen ? 1 : 0 }}
            className="flex items-center"
          >
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">U</span>
              </div>
            </div>
            {isOpen && (
              <div className="ml-3">
                <p className="text-sm font-medium text-white">User</p>
                <p className="text-xs text-gray-400">Free Plan</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;