import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import '../styles/LibrarianDashboard.css';

import AddBookModal from './LibrarianAddBook';
import AddVideoModal from './LibrarianAddVideo';
import ViewAllBooks from './LibrarianViewAllBooks';
import ViewAllVideos from './LibrarianViewAllVideos';
import LibrarianViewAllReviews from './LibrarianViewAllReviews'; // ⬅️ NEW

function LibrarianDashboard() {
  const navigate = useNavigate();
  const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');

  const [stats, setStats] = useState({ totalBooks: 0, totalVideos: 0 });
  const [loading, setLoading] = useState(true);

  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);

  const [activeView, setActiveView] = useState('home');
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchStats = async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);
    try {
      const [booksResponse, videosResponse] = await Promise.all([
        api.get('/librarian/view-all-books'),
        api.get('/librarian/view-all-videos'),
      ]);

      setStats({
        totalBooks: booksResponse.data.total,
        totalVideos: videosResponse.data.total,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(true);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const renderHomeView = () => (
    <>
      <div className="stats-container">
        <div className="stat-item">
          <span className="stat-label">Total Books</span>
          <span className="stat-value">{stats.totalBooks}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Videos</span>
          <span className="stat-value">{stats.totalVideos}</span>
        </div>
      </div>

      <main className="dashboard-grid">
        {/* Row 1 — Add buttons */}
        <button
          onClick={() => setIsAddBookModalOpen(true)}
          className="dashboard-card card-add"
        >
          <h3>Add Book</h3>
          <p>Create a new book entry.</p>
        </button>

        <button
          onClick={() => setIsAddVideoModalOpen(true)}
          className="dashboard-card card-add"
        >
          <h3>Add Video</h3>
          <p>Create a new video entry.</p>
        </button>

        {/* Row 2 — View buttons */}
        <button
          onClick={() => setActiveView('viewBooks')}
          className="dashboard-card card-view"
        >
          <h3>View All Books</h3>
          <p>Browse and manage books.</p>
        </button>

        <button
          onClick={() => setActiveView('viewVideos')}
          className="dashboard-card card-view"
        >
          <h3>View All Videos</h3>
          <p>Browse and manage videos.</p>
        </button>

        {/* Row 3 — Full-width yellow review card */}
        <button
          onClick={() => setActiveView('viewReviews')}
          className="dashboard-card card-review"
        >
          <h3>View All Reviews</h3>
          <p>See book & video reviews (no app reviews).</p>
        </button>
      </main>

    </>
  );

  const renderActiveView = () => {
    switch (activeView) {
      case 'viewBooks':
        return <ViewAllBooks key={`books-${refreshKey}`} />;
      case 'viewVideos':
        return <ViewAllVideos key={`videos-${refreshKey}`} />;
      case 'viewReviews': // ⬅️ NEW
        return <LibrarianViewAllReviews key={`reviews-${refreshKey}`} />;
      default:
        return renderHomeView();
    }
  };

  if (loading) {
    return <div className="loading-state">Loading Dashboard...</div>;
  }

  return (
    <div className="librarian-dashboard-container">
      <header className="dashboard-header">
        {activeView === 'home' ? (
          <h1>Librarian Dashboard</h1>
        ) : (
          <button onClick={() => setActiveView('home')} className="header-back-btn">
            &larr; Back to Dashboard
          </button>
        )}

        <div className="header-actions">
          <span>
            Welcome Librarian, <strong>{profile.first_name}</strong>
          </span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      <div className="admin-content-area">{renderActiveView()}</div>

      {isAddBookModalOpen && (
        <AddBookModal
          onClose={() => setIsAddBookModalOpen(false)}
          onBookAdded={() => {
            fetchStats(false);
            setRefreshKey((prevKey) => prevKey + 1);
          }}
        />
      )}

      {isAddVideoModalOpen && (
        <AddVideoModal
          onClose={() => setIsAddVideoModalOpen(false)}
          onVideoAdded={() => {
            fetchStats(false);
            setRefreshKey((prevKey) => prevKey + 1);
          }}
        />
      )}
    </div>
  );
}

export default LibrarianDashboard;
