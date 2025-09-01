import React from 'react';
import { motion } from 'framer-motion';
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';

const Header = ({ user, onMenuToggle }) => {
  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="text-gray-400 hover:text-white transition-colors lg:hidden"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-semibold text-white">AI Assistant Platform</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="text-gray-400 hover:text-white transition-colors">
            <BellIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;


