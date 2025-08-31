// frontend/src/pages/Profile.tsx
import React from 'react';

const Profile: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Profile management coming soon...</p>
      </div>
    </div>
  );
};

export default Profile;
