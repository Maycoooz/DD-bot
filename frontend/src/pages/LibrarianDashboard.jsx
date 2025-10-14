import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import '../styles/LibrarianDashboard.css';
import AddBookModal from './LibrarianAddBook'
import AddVideoModal from './LibrarianAddVideo';

function LibrarianDashboard() {
    const navigate = useNavigate();
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');

    const [stats, setStats] = useState({ totalBooks: 0, totalVideos: 0 });
    const [loading, setLoading] = useState(true);
    const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
    const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);

    const fetchStats = async (isInitialLoad = false) => {
        if (isInitialLoad) {
            setLoading(true);
        }
        try {
            const [booksResponse, videosResponse] = await Promise.all([
                api.get('/librarian/view-all-books'),
                api.get('/librarian/view-all-videos')
            ]);
            setStats({
                totalBooks: booksResponse.data.length,
                totalVideos: videosResponse.data.length
            });
        } catch (error) {
            console.error("Failed to fetch dashboard stats:", error);
        } finally {
            if (isInitialLoad) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchStats(true);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    if (loading) {
        return <div className="loading-state">Loading Dashboard...</div>;
    }

    return (
        <div className="librarian-dashboard-container">
            <header className="dashboard-header">
                <h1>Librarian Dashboard</h1>
                <div className="header-actions">
                    <span>Welcome Librarian, <strong>{profile.first_name}</strong></span>
                    <button onClick={handleLogout} className="btn-logout">Logout</button>
                </div>
            </header>

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
                <button onClick={() => setIsAddBookModalOpen(true)} className="dashboard-card card-add">
                    <h3>Add Book</h3>
                    <p>Create a new book entry in the database.</p>
                </button>
                <button onClick={() => navigate('/librarian/view-books')} className="dashboard-card card-view">
                    <h3>View All Books</h3>
                    <p>Browse and manage the existing book collection.</p>
                </button>
                <button onClick={() => setIsAddVideoModalOpen(true)} className="dashboard-card card-add">
                    <h3>Add Video</h3>
                    <p>Create a new video entry in the database.</p>
                </button>
                <button onClick={() => navigate('/librarian/view-videos')} className="dashboard-card card-view">
                    <h3>View All Videos</h3>
                    <p>Browse and manage the existing video collection.</p>
                </button>
            </main>

            {isAddBookModalOpen && (
                <AddBookModal 
                    onClose={() => setIsAddBookModalOpen(false)}
                    onBookAdded={() => fetchStats(false)}
                />
            )}

            {isAddVideoModalOpen && (
                <AddVideoModal
                    onClose={() => setIsAddVideoModalOpen(false)}
                    onVideoAdded={() => fetchStats(false)}
                />
            )}
        </div>
    );
}

export default LibrarianDashboard;