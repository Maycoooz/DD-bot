import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminDashboard.css';

import AdminManageUsers from './AdminManageUsers';
import AdminEditLandingPage from './AdminEditLandingPage';
// Import other components as you create them

const dashboardItems = [
    { title: 'Manage Parents & Kids', view: 'manageUsers' },
    { title: 'Manage Librarians', view: 'manageLibrarians' },
    { title: 'Edit Landing Page Reviews', view: 'editReviews' },
    { title: 'Edit Landing Page', view: 'editLandingPage' },
];

function AdminDashboard() {
    const navigate = useNavigate();
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const [activeView, setActiveView] = useState('home'); // 'home' shows the grid

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const renderActiveView = () => {
        switch (activeView) {
            case 'manageUsers':
                return <AdminManageUsers />;
            case 'editLandingPage':
                return <AdminEditLandingPage />
            // Add other cases here
            default:
                // This renders the grid of buttons
                return (
                    <main className="dashboard-grid">
                        {dashboardItems.map((item, index) => (
                            <button key={index} onClick={() => setActiveView(item.view)} className="dashboard-card">
                                <h3>{item.title}</h3>
                            </button>
                        ))}
                    </main>
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

            <div className="admin-content-area">
                {renderActiveView()}
            </div>
        </div>
    );
}

export default AdminDashboard;