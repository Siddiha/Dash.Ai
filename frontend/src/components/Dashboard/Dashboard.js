import React from 'react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <h1 className="text-2xl font-bold text-white mb-4">Dashboard</h1>
        <p className="text-gray-400">Welcome to your AI Assistant Dashboard!</p>
      </motion.div>
    </div>
  );
};

export default Dashboard;


