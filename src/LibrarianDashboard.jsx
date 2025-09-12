import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth  } from './AuthContext';
import logo from './assets/logo.png';

const API_BASE = 'http://localhost:8000';

// Header Component
const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-green-600 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="DD-bot Logo" className="h-10 w-10" />
          <h1 className="text-2xl font-bold">DD-bot Librarian Dashboard</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm">Welcome, {user?.username || 'Librarian'}</span>
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
    { id: 'books', label: 'Book Management' },
    { id: 'videos', label: 'Video Management' },
    { id: 'reviews', label: 'Review Moderation' },
    { id: 'recommendations', label: 'Recommendations' },
    { id: 'reports', label: 'Reports' },
    { id: 'profile', label: 'My Profile' }
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
                  ? 'bg-green-600 text-white border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
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

// Book Management Component
const BookManagement = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Book Management</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">Manage books in the library collection</p>
          <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            Add New Book
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 border rounded">
            <div>
              <h3 className="font-semibold">Total Books</h3>
              <p className="text-gray-600">1,250 books in collection</p>
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              View All Books
            </button>
          </div>
          <div className="flex justify-between items-center p-4 border rounded">
            <div>
              <h3 className="font-semibold">Pending Approval</h3>
              <p className="text-gray-600">15 books awaiting review</p>
            </div>
            <button className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              Review Pending
            </button>
          </div>
          <div className="flex justify-between items-center p-4 border rounded">
            <div>
              <h3 className="font-semibold">Popular Books</h3>
              <p className="text-gray-600">Most read this month</p>
            </div>
            <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              View Popular
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Video Management Component
const VideoManagement = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Video Management</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">Manage educational videos and content</p>
          <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            Add New Video
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 border rounded">
            <div>
              <h3 className="font-semibold">Total Videos</h3>
              <p className="text-gray-600">350 videos available</p>
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              View All Videos
            </button>
          </div>
          <div className="flex justify-between items-center p-4 border rounded">
            <div>
              <h3 className="font-semibold">Pending Review</h3>
              <p className="text-gray-600">8 videos awaiting approval</p>
            </div>
            <button className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              Review Videos
            </button>
          </div>
          <div className="flex justify-between items-center p-4 border rounded">
            <div>
              <h3 className="font-semibold">Most Watched</h3>
              <p className="text-gray-600">Top videos this week</p>
            </div>
            <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Review Moderation Component
const ReviewModeration = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Review Moderation</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">Moderate and approve parent reviews</p>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 border rounded">
            <div>
              <h3 className="font-semibold">Pending Reviews</h3>
              <p className="text-gray-600">12 reviews awaiting moderation</p>
            </div>
            <button className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              Moderate Reviews
            </button>
          </div>
          <div className="flex justify-between items-center p-4 border rounded">
            <div>
              <h3 className="font-semibold">Flagged Content</h3>
              <p className="text-gray-600">3 reviews flagged for review</p>
            </div>
            <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
              Review Flagged
            </button>
          </div>
          <div className="flex justify-between items-center p-4 border rounded">
            <div>
              <h3 className="font-semibold">Approved Reviews</h3>
              <p className="text-gray-600">1,245 reviews approved</p>
            </div>
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              View Approved
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Recommendations Component
const Recommendations = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Content Recommendations</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">Create and manage content recommendations</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Age-Based Recommendations</h3>
            <p className="text-sm text-gray-600 mb-2">Curate content by age groups</p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Manage Age Groups
            </button>
          </div>
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Featured Content</h3>
            <p className="text-sm text-gray-600 mb-2">Highlight special collections</p>
            <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              Feature Content
            </button>
          </div>
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Seasonal Recommendations</h3>
            <p className="text-sm text-gray-600 mb-2">Holiday and seasonal content</p>
            <button className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              Manage Seasonal
            </button>
          </div>
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Educational Themes</h3>
            <p className="text-sm text-gray-600 mb-2">Subject-based collections</p>
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Manage Themes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reports Component
const Reports = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Reports & Analytics</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">View usage statistics and generate reports</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 border rounded text-center">
            <h3 className="font-semibold text-lg">Books Read This Month</h3>
            <p className="text-3xl font-bold text-blue-600">1,245</p>
          </div>
          <div className="p-4 border rounded text-center">
            <h3 className="font-semibold text-lg">Videos Watched</h3>
            <p className="text-3xl font-bold text-green-600">856</p>
          </div>
          <div className="p-4 border rounded text-center">
            <h3 className="font-semibold text-lg">Active Users</h3>
            <p className="text-3xl font-bold text-purple-600">189</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 border rounded">
            <span>Monthly Usage Report</span>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Generate Report
            </button>
          </div>
          <div className="flex justify-between items-center p-4 border rounded">
            <span>Content Performance Analysis</span>
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              View Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Profile Component
const Profile = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">My Profile</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">Manage your librarian profile and settings</p>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 border rounded">
            <div>
              <h3 className="font-semibold">Personal Information</h3>
              <p className="text-gray-600">Update your profile details</p>
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Edit Profile
            </button>
          </div>
          <div className="flex justify-between items-center p-4 border rounded">
            <div>
              <h3 className="font-semibold">Change Password</h3>
              <p className="text-gray-600">Update your account password</p>
            </div>
            <button className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              Change Password
            </button>
          </div>
          <div className="flex justify-between items-center p-4 border rounded">
            <div>
              <h3 className="font-semibold">Notification Settings</h3>
              <p className="text-gray-600">Configure your notifications</p>
            </div>
            <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              Manage Notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main LibrarianDashboard Component
const LibrarianDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('books');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'books':
        return <BookManagement />;
      case 'videos':
        return <VideoManagement />;
      case 'reviews':
        return <ReviewModeration />;
      case 'recommendations':
        return <Recommendations />;
      case 'reports':
        return <Reports />;
      case 'profile':
        return <Profile />;
      default:
        return <BookManagement />;
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

export default LibrarianDashboard;