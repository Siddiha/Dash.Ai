import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  HomeIcon, 
  ChatBubbleLeftRightIcon, 
  Cog6ToothIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen, onToggle }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
    { name: 'Integrations', href: '/integrations', icon: Cog6ToothIcon },
  ];

  return (
    <motion.div
      initial={{ width: isOpen ? 256 : 64 }}
      animate={{ width: isOpen ? 256 : 64 }}
      className="bg-gray-800 border-r border-gray-700 h-full fixed left-0 top-0 z-50"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {isOpen && (
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold text-white"
          >
            AI Assistant
          </motion.h1>
        )}
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
      </div>

      <nav className="mt-6">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {item.name}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>
    </motion.div>
  );
};

export default Sidebar;
