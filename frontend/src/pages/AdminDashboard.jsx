import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import '../styles/AdminDashboard.css';

import AdminManageUsers from './AdminManageUsers';
import AdminEditLandingPage from './AdminEditLandingPage';
import AdminManageLibrarians from './AdminManageLibrarians';
import AdminEditLandingPageReviews from './AdminEditLandingPageReviews';
import AdminViewAllReviews from './AdminViewAllReviews';

const dashboardItems = [
  {
    title: 'Manage Parents & Kids',
    description: 'View and Delete parent/child accounts.',
    view: 'manageUsers',
  },
  {
    title: 'Manage Librarians',
    description: 'Approve & Delete Librarian Accounts. View book & video Librarians added.',
    view: 'manageLibrarians',
  },
  {
    title: 'Edit Landing Page Reviews',
    description: 'Curate the public reviews shown on the Landing Page.',
    view: 'editReviews',
  },
  {
    title: 'Edit Landing Page',
    description: 'Update Landing Page content.',
    view: 'editLandingPage',
  },
  {
    title: 'View All Reviews',
    description: 'Browse all book, video & app reviews with filters.',
    view: 'viewAllReviews',
  },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');

  const [activeView, setActiveView] = useState('home');
  const [stats, setStats] = useState({
    total_users: 0,        // excludes admins
    total_parents: 0,
    total_kids: 0,
    total_librarians: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch the stats (adjust URL/fields if your API differs)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/user-stats');
        setStats({
          total_users: data.total_users ?? 0,
          total_parents: data.total_parents ?? 0,
          total_kids: data.total_kids ?? 0,
          total_librarians: data.total_librarians ?? 0,
        });
      } catch (e) {
        console.error('Failed to load user stats', e);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

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
            {/* ---------- Stats Row (top) ---------- */}
            <section className="admin-stats">
              <div className="stat-card">
                <span className="stat-label">Total Users</span>
                <span className="stat-value">
                  {loadingStats ? '—' : stats.total_users}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Parents</span>
                <span className="stat-value">
                  {loadingStats ? '—' : stats.total_parents}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Kids</span>
                <span className="stat-value">
                  {loadingStats ? '—' : stats.total_kids}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Librarians</span>
                <span className="stat-value">
                  {loadingStats ? '—' : stats.total_librarians}
                </span>
              </div>
            </section>

            {/* ---------- Navigation Cards (buttons) ---------- */}
            <main className="dashboard-grid">
              {dashboardItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setActiveView(item.view)}
                  className={`dashboard-card ${item.view === 'viewAllReviews' ? 'card-review' : ''}`}
                >
                  <div className="card-body">
                    <h3>{item.title}</h3>
                    <p className="card-subtitle">{item.description}</p>
                  </div>
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
          <span>
            Welcome Admin, <strong>{profile.first_name}</strong>
          </span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <div className="admin-content-area">{renderActiveView()}</div>
    </div>
  );
}

export default AdminDashboard;
