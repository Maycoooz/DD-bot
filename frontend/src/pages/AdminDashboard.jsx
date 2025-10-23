// AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminDashboard.css';

import AdminManageUsers from './AdminManageUsers';
import AdminEditLandingPage from './AdminEditLandingPage';
import AdminManageLibrarians from './AdminManageLibrarians';
import AdminEditLandingPageReviews from './AdminEditLandingPageReviews';
import AdminViewAllReviews from './AdminViewAllReviews';
import api from '../api/axiosConfig';

const dashboardItems = [
  { title: 'Manage Parents & Kids', view: 'manageUsers' },
  { title: 'Manage Librarians', view: 'manageLibrarians' },
  { title: 'Edit Landing Page Reviews', view: 'editReviews' },
  { title: 'Edit Landing Page', view: 'editLandingPage' },
  { title: 'View All Reviews', view: 'viewAllReviews' },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  const [activeView, setActiveView] = useState('home');

  // NEW: stats
  const [stats, setStats] = useState({
    total_users: 0,
    total_parents: 0,
    total_kids: 0,
    total_librarians: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/user-stats');
        setStats(data || {});
      } catch {
        // fail silently; you can toast if you like
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const renderStatsBar = () => (
    <section className="admin-stats">
      <div className="stat-card">
        <span className="stat-label">Total Users</span>
        <span className="stat-value">{statsLoading ? '—' : stats.total_users}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Total Parents</span>
        <span className="stat-value">{statsLoading ? '—' : stats.total_parents}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Total Kids</span>
        <span className="stat-value">{statsLoading ? '—' : stats.total_kids}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Total Librarians</span>
        <span className="stat-value">{statsLoading ? '—' : stats.total_librarians}</span>
      </div>
    </section>
  );

  const renderActiveView = () => {
    switch (activeView) {
      case 'manageUsers':
        return <AdminManageUsers />;
      case 'editLandingPage':
        return <AdminEditLandingPage />;
      case 'manageLibrarians':
        return <AdminManageLibrarians />;
      case 'editReviews':
        return <AdminEditLandingPageReviews />;
      case 'viewAllReviews':
        return <AdminViewAllReviews />;
      default:
        return (
          <>
            {renderStatsBar()}
            <main className="dashboard-grid">
              {dashboardItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setActiveView(item.view)}
                  className={`dashboard-card ${index === 4 ? 'card-review' : ''}`}
                >
                  <h3>{item.title}</h3>
                </button>
              ))}
            </main>
          </>
        );
    }
  };

  return (
    <div className="admin-dashboard-container">
      <header className="admin-header">
        {activeView === 'home' ? (
          <h1>Admin Dashboard</h1>
        ) : (
          <button onClick={() => setActiveView('home')} className="header-back-btn">
            &larr; Back to Dashboard
          </button>
        )}
        <div className="header-actions">
          <span>Welcome Admin, <strong>{profile.first_name}</strong></span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="admin-content-area">{renderActiveView()}</div>
    </div>
  );
}

export default AdminDashboard;
