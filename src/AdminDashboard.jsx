import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import logo from "./assets/logo.png";


const API_BASE = import.meta.env.VITE_API_URL;

// ---------- Header ----------
const Header = ({ user, onLogout }) => {
  return (
    <header className="admin-header">
      <div className="admin-header-content">
        <div className="admin-logo">
          <img src={logo} alt="DD-bot Logo" className="admin-logo-img" />
          <h1 className="admin-title">DD-bot Admin Dashboard</h1>
        </div>
        <div className="admin-user-section">
          <span className="admin-welcome">
            Welcome, {user?.username || "Admin"}
          </span>
          <button onClick={onLogout} className="admin-logout-btn">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

// ---------- Navigation ----------
const Navigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "users", label: "User Management" },
    { id: "librarians", label: "Librarian Management" },
    { id: "content", label: "Content Management" },
    { id: "reviews", label: "Review Management" },
    { id: "analytics", label: "Analytics" },
    { id: "settings", label: "System Settings" },
  ];

  return (
    <nav className="admin-nav">
      <div className="admin-nav-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`admin-tab-btn ${
              activeTab === tab.id ? "active" : ""
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
};

// ---------- Card Component ----------
const Card = ({ title, value, buttonText, color }) => (
  <div className="admin-card">
    <span className="admin-card-title">
      {title}: <strong>{value}</strong>
    </span>
    <button className="admin-card-btn" style={{ backgroundColor: color }}>
      {buttonText}
    </button>
  </div>
);

// ---------- Tab Sections ----------
const UserManagement = () => (
  <div className="admin-section">
    <h2>User Management</h2>
    <div className="admin-card-container">
      <Card title="Total Users" value="150" buttonText="View All Users" color="#3b82f6" />
      <Card title="Active Parents" value="85" buttonText="Manage Parents" color="#10b981" />
      <Card title="Active Kids" value="65" buttonText="Manage Kids" color="#8b5cf6" />
    </div>
  </div>
);

const LibrarianManagement = () => (
  <div className="admin-section">
    <h2>Librarian Management</h2>
    <div className="admin-card-container">
      <Card title="Active Librarians" value="12" buttonText="View All Librarians" color="#3b82f6" />
      <Card title="Pending Applications" value="3" buttonText="Review Applications" color="#f97316" />
      <Card title="Add New Librarian" value="" buttonText="Add Librarian" color="#10b981" />
    </div>
  </div>
);

const ContentManagement = () => (
  <div className="admin-section">
    <h2>Content Management</h2>
    <div className="admin-card-container grid-2">
      <Card title="Books" value="1,250" buttonText="Manage Books" color="#3b82f6" />
      <Card title="Videos" value="350" buttonText="Manage Videos" color="#8b5cf6" />
    </div>
  </div>
);

const ReviewManagement = () => (
  <div className="admin-section">
    <h2>Review Management</h2>
    <div className="admin-card-container">
      <Card title="Pending Reviews" value="25" buttonText="Review Pending" color="#f97316" />
      <Card title="Flagged Reviews" value="5" buttonText="Review Flagged" color="#ef4444" />
      <Card title="All Reviews" value="1,850" buttonText="View All Reviews" color="#3b82f6" />
    </div>
  </div>
);

const Analytics = () => (
  <div className="admin-section">
    <h2>Analytics</h2>
    <div className="admin-card-container grid-3">
      <Card title="Daily Active Users" value="245" buttonText="View Report" color="#3b82f6" />
      <Card title="Books Read Today" value="89" buttonText="View Report" color="#10b981" />
      <Card title="Videos Watched" value="156" buttonText="View Report" color="#8b5cf6" />
    </div>
  </div>
);

const SystemSettings = () => (
  <div className="admin-section">
    <h2>System Settings</h2>
    <div className="admin-card-container">
      <Card title="Database Backup" value="" buttonText="Create Backup" color="#3b82f6" />
      <Card title="System Maintenance" value="" buttonText="Schedule Maintenance" color="#f97316" />
      <Card title="Security Settings" value="" buttonText="Configure Security" color="#ef4444" />
    </div>
  </div>
);

// ---------- Main Admin Dashboard ----------
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "users": return <UserManagement />;
      case "librarians": return <LibrarianManagement />;
      case "content": return <ContentManagement />;
      case "reviews": return <ReviewManagement />;
      case "analytics": return <Analytics />;
      case "settings": return <SystemSettings />;
      default: return <UserManagement />;
    }
  };

  return (
    <div className="admin-dashboard">
      <Header user={user} onLogout={handleLogout} />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="admin-main">{renderContent()}</main>
    </div>
  );
};

export default AdminDashboard;
