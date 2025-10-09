import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
    const navigate = useNavigate();
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // 1. Use function-based class names
    const dashboardItems = [
        { title: 'Manage Parents & Kids', path: '/admin/manage-users', className: 'card-manage-users' },
        { title: 'Manage Librarians', path: '/admin/manage-librarians', className: 'card-manage-librarians' },
        { title: 'Edit Landing Page Reviews', path: '/admin/edit-reviews', className: 'card-edit-reviews' },
        { title: 'Edit Landing Page', path: '/admin/edit-landing-page', className: 'card-edit-landing' },
    ];

    return (
        <div className="admin-dashboard-container">
            <header className="admin-header">
                <h1>Admin Dashboard</h1>
                <div className="header-actions">
                    <span>Welcome Admin, <strong>{profile.first_name}</strong></span>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
            </header>

            <main className="dashboard-grid">
                {dashboardItems.map((item, index) => (
                    <Link key={index} to={item.path} className={`dashboard-card ${item.className}`}>
                        <h3>{item.title}</h3>
                    </Link>
                ))}
            </main>
        </div>
    );
}

export default AdminDashboard;