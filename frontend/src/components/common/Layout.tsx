// frontend/src/components/Layout.tsx
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ChatInterface from "./chat/ChatInterface";

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} setChatOpen={setChatOpen} />

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Chat Interface */}
      <ChatInterface open={chatOpen} setOpen={setChatOpen} />
    </div>
  );
}

export default Layout;
