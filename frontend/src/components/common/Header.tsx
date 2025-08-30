// frontend/src/components/Header.tsx
import React from "react";
import { MenuIcon, ChatIcon, BellIcon } from "@heroicons/react/outline";
import { useAuth } from "../../contexts/AuthContext";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
  setChatOpen: (open: boolean) => void;
}

function Header({ setSidebarOpen, setChatOpen }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
      <button
        type="button"
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex">{/* Search can go here */}</div>

        <div className="ml-4 flex items-center md:ml-6 space-x-4">
          {/* Chat Button */}
          <button
            type="button"
            className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => setChatOpen(true)}
          >
            <ChatIcon className="h-6 w-6" />
          </button>

          {/* Notifications */}
          <button
            type="button"
            className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <BellIcon className="h-6 w-6" />
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <div className="flex items-center space-x-3">
              <img
                className="h-8 w-8 rounded-full"
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${user?.name}&background=6366f1&color=fff`
                }
                alt={user?.name}
              />
              <div className="hidden md:block">
                <div className="text-sm font-medium text-gray-700">
                  {user?.name}
                </div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;
