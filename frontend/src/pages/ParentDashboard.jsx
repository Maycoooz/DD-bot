import React, { useState, useEffect } from 'react';
import { data, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import '../styles/ParentDashboard.css';

// Import Placeholder Components
import ParentHome from './ParentHome.jsx'; 
import ParentProfile from './ParentProfile.jsx'; 
import CreateChild from './ParentCreateChild.jsx';
import ViewChildAccounts from './ParentViewChildAccounts.jsx'
import ParentSearchBooks from './ParentSearchBooks.jsx';
import ParentSearchVideos from './ParentSearchVideos.jsx';
import AddAppReview from './AddAppReview.jsx';
import DeleteAppReview from './DeleteAppReview.jsx';

// --- Dashboard Menu Definition ---
const menuItems = {
    General: [
        { label: 'Home', component: 'home', key: 'home' }, 
        { label: 'My Profile', component: 'profile', key: 'profile' },
    ],
    'Child Overview': [
        { label: 'Create Child Account', component: 'createChild', key: 'createChild' },
        { label: 'View Child Accounts', component: 'viewChildren', key: 'viewChildren' },
        { label: 'Child Chat History', component: 'childChatHistory', key: 'childChatHistory' }
    ],
    Search: [
        { label: 'Search Books', component: 'searchBooks', key: 'searchBooks' },
        { label: 'Search Videos', component: 'searchVideos', key: 'searchVideos' },
    ],
    Review: [
        { label: 'Add Review', component: 'addReview', key: 'addReview' },
        { label: 'Delete Review', component: 'deleteReview', key: 'deleteReview' }
    ]
};

function ParentDashboard() {
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeComponent, setActiveComponent] = useState('home'); // Default is home
     
    // ----------------------------------------------------------------------
    // DATA FETCHING (GET /users/me/)
    // ----------------------------------------------------------------------
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Fetch the user profile using the stored token (via interceptor)
                const response = await api.get('/users/me/');
                setUserProfile(response.data);
                // Also update localStorage in case the profile changed since login
                localStorage.setItem('userProfile', JSON.stringify(response.data));
            } catch (error) {
                console.error("Failed to fetch user profile or token expired.", error);
                // Redirect to login if token is invalid or request fails
                handleLogout(); 
            } finally {
                setLoading(false);
            }
        };

        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
            setUserProfile(JSON.parse(storedProfile));
            setLoading(false);
        } else {
            // If profile isn't in local storage, fetch it
            fetchProfile();
        }
    }, []);

    // --- Handler for clearing messages ---
    const clearMessages = () => {
        setError('');
        setSuccess('');
        setPasswordError('');
    };

    // ----------------------------------------------------------------------
    // LOGOUT HANDLER
    // ----------------------------------------------------------------------
    const handleLogout = () => {
        localStorage.clear(); // Clear all stored user data and tokens
        navigate('/login'); // Redirect to login page
    };

    // ----------------------------------------------------------------------
    // RENDERING LOGIC
    // ----------------------------------------------------------------------
    const renderComponent = () => {
        switch (activeComponent) {
            case 'home': 
                return <ParentHome />;
            case 'profile':
                return <ParentProfile onProfileUpdate={setUserProfile} />;
            case 'createChild':
                return <CreateChild parentProfile={userProfile} />;
            case 'viewChildren':
                return <ViewChildAccounts></ViewChildAccounts>;
            case 'childChatHistory':
                return <div><h2>Child Chat History</h2><p>Chat logs coming soon...</p></div>;
            case 'searchBooks':
                return <ParentSearchBooks></ParentSearchBooks>;
            case 'searchVideos':
                return <ParentSearchVideos></ParentSearchVideos>;
            case 'addReview':
                return <AddAppReview></AddAppReview>;
            case 'deleteReview':
                return <DeleteAppReview></DeleteAppReview>
            default:
                return <div><h2>Welcome</h2><p>Select an option from the sidebar to begin.</p></div>;
        }
    };

    if (loading) {
        return <div className="loading-state">Loading Dashboard...</div>;
    }

    if (!userProfile) {
        return <div className="loading-state">Error loading user data. Please <button onClick={handleLogout}>Log In</button> again.</div>;
    }

    // Display first name from the fetched profile data
    const firstName = userProfile.first_name || 'Parent';

    return (
        <div className="dashboard-container">
            {/* --- Dashboard Header --- */}
            <header className="dashboard-header">
                <h1>PARENT DASHBOARD</h1>
                <div className="user-info">
                    <p className="welcome-text">Welcome, <strong>{firstName}</strong></p>
                    <button className="logout-button" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>

            <div className="dashboard-main">
                {/* --- Sidebar (Navigation) --- */}
                <nav className="dashboard-sidebar">
                    {Object.entries(menuItems).map(([sectionTitle, items]) => (
                        <div key={sectionTitle} className="sidebar-section">
                            <h3>{sectionTitle}</h3>
                            <ul>
                                {items.map((item) => (
                                    <li key={item.key}>
                                        <button 
                                            className={activeComponent === item.key ? 'active' : ''}
                                            onClick={() => setActiveComponent(item.key)}
                                        >
                                            {item.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* --- Main Content Area --- */}
                <main className="dashboard-content">
                    {/* The content rendering based on activeComponent state */}
                    {renderComponent()}
                </main>
            </div>
        </div>
    );
}

export default ParentDashboard;
