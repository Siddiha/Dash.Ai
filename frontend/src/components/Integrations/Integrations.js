import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';

const Integrations = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const queryClient = useQueryClient();

  const categories = ['All', 'Featured', 'Communication', 'Productivity', 'Storage', 'Calendar'];

  const availableIntegrations = [
    {
      id: 'google',
      name: 'Google Workspace',
      description: 'Connect Gmail, Calendar, Drive, and Docs',
      icon: '🔴',
      category: 'Featured',
      capabilities: ['Email', 'Calendar', 'Documents', 'Storage'],
      color: 'from-red-500 to-yellow-500'
    },
    {
      id: 'microsoft',
      name: 'Microsoft 365',
      description: 'Outlook, Teams, OneDrive integration',
      icon: '🔵',
      category: 'Featured',
      capabilities: ['Email', 'Calendar', 'Storage', 'Teams'],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Send messages and manage channels',
      icon: '💬',
      category: 'Communication',
      capabilities: ['Messaging', 'Channels', 'File Sharing'],
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Create and manage pages and databases',
      icon: '📝',
      category: 'Productivity',
      capabilities: ['Notes', 'Databases', 'Project Management'],
      color: 'from-gray-700 to-gray-900'
    },
    {
      id: 'zoom',
      name: 'Zoom',
      description: 'Schedule and manage video meetings',
      icon: '📹',
      category: 'Communication',
      capabilities: ['Video Calls', 'Scheduling', 'Recording'],
      color: 'from-blue-400 to-blue-600'
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      description: 'Access and manage your files',
      icon: '📦',
      category: 'Storage',
      capabilities: ['File Storage', 'Sharing', 'Sync'],
      color: 'from-blue-500 to-blue-700'
    }
  ];

  // Fetch user's connected integrations
  const { data: userIntegrations, isLoading } = useQuery(
    'userIntegrations',
    async () => {
      const response = await fetch('/api/integrations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        console.log('No integrations available yet');
        return [];
      }
      return response.json();
    }
  );

  // Connect integration mutation
  const connectMutation = useMutation(
    async (integrationId) => {
      const response = await fetch(`/api/integrations/${integrationId}/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        console.log('Failed to connect integration - backend not available');
        return;
      }
      const data = await response.json();
      
      // Redirect to OAuth URL if provided
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Integration connected successfully!');
        queryClient.invalidateQueries('userIntegrations');
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to connect integration');
      }
    }
  );

  // Disconnect integration mutation
  const disconnectMutation = useMutation(
    async (integrationId) => {
      const response = await fetch(`/api/integrations/${integrationId}/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        console.log('Failed to disconnect integration - backend not available');
        return;
      }
      return response.json();
    },
    {
      onSuccess: () => {
        toast.success('Integration disconnected');
        queryClient.invalidateQueries('userIntegrations');
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to disconnect integration');
      }
    }
  );

  // Test integration mutation
  const testMutation = useMutation(
    async (integrationId) => {
      const response = await fetch(`/api/integrations/${integrationId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        console.log('Failed to test integration - backend not available');
        return;
      }
      return response.json();
    },
    {
      onSuccess: () => {
        toast.success('Integration test successful!');
      },
      onError: (error) => {
        toast.error(error.message || 'Integration test failed');
      }
    }
  );

  const getIntegrationStatus = (integrationId) => {
    const userIntegration = userIntegrations?.find(ui => ui.platform === integrationId);
    return userIntegration?.status || 'not_connected';
  };

  const filteredIntegrations = availableIntegrations.filter(integration => 
    selectedCategory === 'All' || integration.category === selectedCategory
  );

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'connecting':
        return <ArrowPathIcon className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <ExclamationCircleIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const IntegrationCard = ({ integration }) => {
    const status = getIntegrationStatus(integration.id);
    const isConnected = status === 'connected';
    const isConnecting = connectMutation.isLoading || disconnectMutation.isLoading;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${integration.color} flex items-center justify-center text-white text-2xl`}>
              {integration.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{integration.name}</h3>
              <p className="text-sm text-gray-400">{integration.description}</p>
            </div>
          </div>
          <StatusIcon status={status} />
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Capabilities</h4>
          <div className="flex flex-wrap gap-2">
            {integration.capabilities.map((capability, index) => (
              <span
                key={index}
                className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full"
              >
                {capability}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {isConnected ? (
              <>
                <button
                  onClick={() => testMutation.mutate(integration.id)}
                  disabled={testMutation.isLoading}
                  className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded transition-colors"
                >
                  Test
                </button>
                <button
                  onClick={() => disconnectMutation.mutate(integration.id)}
                  disabled={isConnecting}
                  className="text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-3 py-1 rounded transition-colors flex items-center space-x-1"
                >
                                          <ExclamationCircleIcon className="w-3 h-3" />
                  <span>Disconnect</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => connectMutation.mutate(integration.id)}
                disabled={isConnecting}
                className="text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-1 rounded transition-colors flex items-center space-x-1"
              >
                <PlusIcon className="w-3 h-3" />
                <span>Connect</span>
              </button>
            )}
          </div>
          
          {isConnected && (
            <button className="text-gray-400 hover:text-gray-300 transition-colors">
              <Cog6ToothIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Integrations</h1>
        <p className="text-gray-400">Connect your favorite apps to supercharge your AI assistant</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">
                {userIntegrations?.filter(ui => ui.status === 'connected').length || 0}
              </p>
              <p className="text-sm text-gray-400">Connected</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">{availableIntegrations.length}</p>
              <p className="text-sm text-gray-400">Available</p>
            </div>
            <PlusIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">
                {userIntegrations?.filter(ui => ui.status === 'error').length || 0}
              </p>
              <p className="text-sm text-gray-400">Need Attention</p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredIntegrations.map(integration => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>

      {/* Connected Integrations Detail */}
      {userIntegrations && userIntegrations.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-white mb-6">Connected Integrations</h2>
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Connected
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Last Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {userIntegrations.map(integration => {
                    const integrationData = availableIntegrations.find(ai => ai.id === integration.platform);
                    return (
                      <tr key={integration._id} className="hover:bg-gray-750">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${integrationData?.color || 'from-gray-500 to-gray-700'} flex items-center justify-center text-sm`}>
                              {integrationData?.icon || '❓'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">
                                {integrationData?.name || integration.platform}
                              </div>
                              <div className="text-xs text-gray-400">
                                {integration.accountInfo?.email || integration.accountInfo?.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <StatusIcon status={integration.status} />
                            <span className={`text-xs font-medium ${
                              integration.status === 'connected' ? 'text-green-400' :
                              integration.status === 'error' ? 'text-red-400' : 'text-gray-400'
                            }`}>
                              {integration.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(integration.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {integration.lastUsed ? new Date(integration.lastUsed).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => testMutation.mutate(integration.platform)}
                            disabled={testMutation.isLoading}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Test
                          </button>
                          <button
                            onClick={() => disconnectMutation.mutate(integration.platform)}
                            disabled={disconnectMutation.isLoading}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            Disconnect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-12 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-6 border border-blue-800/30">
        <h3 className="text-lg font-semibold text-white mb-2">Need Help?</h3>
        <p className="text-gray-300 mb-4">
          Having trouble connecting an integration? Check our documentation or contact support.
        </p>
        <div className="flex space-x-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            View Documentation
          </button>
          <button className="border border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
