import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth  } from './AuthContext';
import logo from './assets/logo.png';

const API_BASE = 'http://localhost:8000';

// Header Component
const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-blue-600 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="DD-bot Logo" className="h-10 w-10" />
          <h1 className="text-2xl font-bold">DD-bot Admin Dashboard</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm">Welcome, {user?.username || 'Admin'}</span>
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

// Navigation Component
const Navigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'users', label: 'User Management' },
    { id: 'librarians', label: 'Librarian Management' },
    { id: 'content', label: 'Content Management' },
    { id: 'reviews', label: 'Review Management' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'System Settings' }
  ];

  return (
    <nav className="bg-gray-100 border-b border-gray-300">
      <div className="container mx-auto">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

// User Management Component
const UserManagement = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">User Management</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">Manage all users in the system</p>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 border rounded">
            <span>Total Users: 150</span>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              View All Users
            </button>
          </div>
          <div className="flex justify-between items-center p-4 border rounded">
            <span>Active Parents: 85</span>
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Manage Parents
            </button>
          </div>
          <div className="flex justify-between items-center p-4 border rounded">
            <span>Active Kids: 65</span>
            <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              Manage Kids
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Librarian Management Component
const LibrarianManagement = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Librarian Management</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">Manage librarian accounts and permissions</p>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 border rounded">
            <span>Active Librarians: 12</span>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              View All Librarians
            </button>
          </div>
          <div className="flex justify-between items-center p-4 border rounded">
            <span>Pending Applications: 3</span>
            <button className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              Review Applications
            </button>
          </div>
          <div className="flex justify-between items-center p-4 border rounded">
            <span>Add New Librarian</span>
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Add Librarian
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Content Management Component
const ContentManagement = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Content Management</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">Manage books, videos, and other content</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Books</h3>
            <p className="text-sm text-gray-600 mb-2">Total: 1,250 books</p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Manage Books
            </button>
          </div>
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Videos</h3>
            <p className="text-sm text-gray-600 mb-2">Total: 350 videos</p>
            <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              Manage Videos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Review Management Component
const ReviewManagement = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Review Management</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">Moderate and manage user reviews</p>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 border rounded">
            <span>Pending Reviews: 25</span>
            <button className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              Review Pending
            </button>
          </div>
          <div className="flex justify-between items-center p-4 border rounded">
            <span>Flagged Reviews: 5</span>
            <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
              Review Flagged
            </button>
          </div>
          <div className="flex justify-between items-center p-4 border rounded">
            <span>All Reviews: 1,850</span>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              View All Reviews
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Analytics Component
const Analytics = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Analytics</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">System analytics and reports</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded text-center">
            <h3 className="font-semibold text-lg">Daily Active Users</h3>
            <p className="text-3xl font-bold text-blue-600">245</p>
          </div>
          <div className="p-4 border rounded text-center">
            <h3 className="font-semibold text-lg">Books Read Today</h3>
            <p className="text-3xl font-bold text-green-600">89</p>
          </div>
          <div className="p-4 border rounded text-center">
            <h3 className="font-semibold text-lg">Videos Watched</h3>
            <p className="text-3xl font-bold text-purple-600">156</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// System Settings Component
const SystemSettings = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">System Settings</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">Configure system settings and preferences</p>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 border rounded">
            <span>Database Backup</span>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Create Backup
            </button>
          </div>
          <div className="flex justify-between items-center p-4 border rounded">
            <span>System Maintenance</span>
            <button className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              Schedule Maintenance
            </button>
          </div>
          <div className="flex justify-between items-center p-4 border rounded">
            <span>Security Settings</span>
            <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
              Configure Security
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main AdminDashboard Component
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'librarians':
        return <LibrarianManagement />;
      case 'content':
        return <ContentManagement />;
      case 'reviews':
        return <ReviewManagement />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="container mx-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;