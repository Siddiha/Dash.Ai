// frontend/src/pages/Billing.tsx
import React from 'react';

const Billing: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your subscription and billing information
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Billing management coming soon...</p>
      </div>
    </div>
  );
};

export default Billing;
