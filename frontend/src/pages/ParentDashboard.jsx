import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import '../styles/ParentDashboard.css';

// Components
import ParentHome from './ParentHome.jsx';
import ParentProfile from './ParentProfile.jsx';
import CreateChild from './ParentCreateChild.jsx';
import ViewChildAccounts from './ParentViewChildAccounts.jsx';
import SearchBooks from './SearchBooks.jsx';
import SearchVideos from './SearchVideos.jsx';
import AddAppReview from './AddAppReview.jsx';
import DeleteAppReview from './DeleteAppReview.jsx';
import ParentChildFavorite from './ParentChildFavorite.jsx';
import ParentChildChatHistory from './ParentChildChatHistory.jsx';
import ParentChildStatistics from './ParentChildStatistics';

// --- Dashboard Menu Definition ---
const menuItems = {
  General: [
    { label: 'Home', component: 'home', key: 'home' },
    { label: 'My Profile', component: 'profile', key: 'profile' },
  ],
  'Child Overview': [
    { label: 'Create Child Account', component: 'createChild', key: 'createChild' },
    { label: 'View Child Accounts', component: 'viewChildren', key: 'viewChildren' },
    { label: 'Child Chat History', component: 'childChatHistory', key: 'childChatHistory' },
    { label: 'Child Favorites', component: 'childFavorites', key: 'childFavorites' },
    { label: 'Child Statistics', component: 'childStatistics', key: 'childStatistics' },
  ],
  Library: [
    { label: 'Search Books', component: 'searchBooks', key: 'searchBooks' },
    { label: 'Search Videos', component: 'searchVideos', key: 'searchVideos' },
  ],
  Review: [
    { label: 'Add Review', component: 'addReview', key: 'addReview' },
    { label: 'Delete Review', component: 'deleteReview', key: 'deleteReview' },
  ],
};

function ParentDashboard() {
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeComponent, setActiveComponent] = useState('home');

  // role/tier for gating
  const [userRole, setUserRole] = useState(null);     // "PARENT" | "ADMIN" | "LIBRARIAN" | ...
  const [parentTier, setParentTier] = useState(null); // "FREE" | "PRO" | null

  // popup state (no backdrop)
  const [gatePopup, setGatePopup] = useState({ show: false, message: '' });

  const handleInternalNavigate = (key) => setActiveComponent(key);

  // ----------------------------------------------------------------------
  // DATA FETCHING (GET /users/me/ + /parent/me if needed)
  // ----------------------------------------------------------------------
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/me/');
        const me = response.data;
        setUserProfile(me);
        localStorage.setItem('userProfile', JSON.stringify(me));

        const roleName = me?.role_name || me?.role?.name || null;
        setUserRole(roleName);

        if (roleName === 'PARENT') {
          try {
            const pr = await api.get('/parent/me');
            const raw = pr.data?.tier;
            const tier =
              typeof raw === 'string' ? raw : raw?.value || raw?.name || 'FREE';
            setParentTier((tier || 'FREE').toUpperCase());
          } catch {
            setParentTier('FREE');
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile or token expired.', error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      const parsed = JSON.parse(storedProfile);
      setUserProfile(parsed);
      const roleName = parsed?.role_name || parsed?.role?.name || null;
      setUserRole(roleName);
      setLoading(false);

      if (roleName === 'PARENT') {
        api
          .get('/parent/me')
          .then((pr) => {
            const raw = pr.data?.tier;
            const tier =
              typeof raw === 'string' ? raw : raw?.value || raw?.name || 'FREE';
            setParentTier((tier || 'FREE').toUpperCase());
          })
          .catch(() => setParentTier('FREE'));
      }
    } else {
      fetchProfile();
    }

    const handler = (e) => {
      const key = e?.detail;
      if (typeof key === 'string') setActiveComponent(key);
    };
    window.addEventListener('PD_NAV', handler);
    return () => window.removeEventListener('PD_NAV', handler);
  }, []);

  // ----------------------------------------------------------------------
  // LOGOUT HANDLER
  // ----------------------------------------------------------------------
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Called by <ParentProfile /> when tier changes, so popup stops after upgrade
  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile(updatedProfile);

    const roleName = updatedProfile?.role_name || updatedProfile?.role?.name || null;
    setUserRole(roleName);

    if (roleName === 'PARENT') {
      const raw = updatedProfile?.tier;
      const tier =
        typeof raw === 'string' ? raw : raw?.value || raw?.name || null;

      if (tier) {
        setParentTier(tier.toUpperCase());
      } else {
        api.get('/parent/me').then((pr) => {
          const raw2 = pr.data?.tier;
          const t2 =
            typeof raw2 === 'string' ? raw2 : raw2?.value || raw2?.name || 'FREE';
          setParentTier((t2 || 'FREE').toUpperCase());
        });
      }
    }
  };

  // ----------------------------------------------------------------------
  // LIBRARY GATE: intercept sidebar clicks for Search Books/Videos
  // ----------------------------------------------------------------------
  const isParentFree =
    userRole === 'PARENT' && (parentTier || 'FREE').toUpperCase() === 'FREE';

  const showGate = (message, ms = 2400) => {
    setGatePopup({ show: true, message });
    window.clearTimeout(showGate._t);
    showGate._t = window.setTimeout(() => {
      setGatePopup({ show: false, message: '' });
    }, ms);
  };

  const handleSidebarClick = (key) => {
    if ((key === 'searchBooks' || key === 'searchVideos') && isParentFree) {
      showGate('Upgrade to PRO to access library search (books & videos).');
      return;
    }
    setActiveComponent(key);
  };

  // ----------------------------------------------------------------------
  // RENDERING LOGIC
  // ----------------------------------------------------------------------
  const renderComponent = () => {
    switch (activeComponent) {
      case 'home':
        return <ParentHome parentId={userProfile.id} />;
      case 'profile':
        return <ParentProfile onProfileUpdate={handleProfileUpdate} />;
      case 'createChild':
        return <CreateChild parentProfile={userProfile} />;
      case 'viewChildren':
        return <ViewChildAccounts />;
      case 'childChatHistory':
        return <ParentChildChatHistory parentId={userProfile.id} />;
      case 'childFavorites':
        return <ParentChildFavorite parentId={userProfile.id} />;
      case 'searchBooks':
        return <SearchBooks />;
      case 'searchVideos':
        return <SearchVideos />;
      case 'addReview':
        return <AddAppReview />;
      case 'deleteReview':
        return <DeleteAppReview />;
      case 'childStatistics':
        return <ParentChildStatistics onNavigate={handleInternalNavigate} />;
      default:
        return (
          <div>
            <h2>Welcome</h2>
            <p>Select an option from the sidebar to begin.</p>
          </div>
        );
    }
  };

  if (loading) {
    return <div className="loading-state">Loading Dashboard...</div>;
  }

  if (!userProfile) {
    return (
      <div className="loading-state">
        Error loading user data. Please <button onClick={handleLogout}>Log In</button> again.
      </div>
    );
  }

  const firstName = userProfile.first_name || 'Parent';

  return (
    <div className="dashboard-container">
      {/* --- Dashboard Header --- */}
      <header className="dashboard-header">
        <h1>PARENT DASHBOARD</h1>
        <div className="user-info">
          <p className="welcome-text">
            Welcome, <strong>{firstName}</strong>
          </p>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-main">
        {/* --- Sidebar --- */}
        <nav className="dashboard-sidebar">
          {Object.entries(menuItems).map(([sectionTitle, items]) => (
            <div key={sectionTitle} className="sidebar-section">
              <h3>{sectionTitle}</h3>
              <ul>
                {items.map((item) => (
                  <li key={item.key}>
                    <button
                      className={activeComponent === item.key ? 'active' : ''}
                      onClick={() => handleSidebarClick(item.key)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* --- Main Content --- */}
        <main className="dashboard-content">{renderComponent()}</main>
      </div>

      {/* Centered popup (no backdrop) */}
      {gatePopup.show && (
        <div
          className="gate-popup"
          role="alert"
          onClick={() => setGatePopup({ show: false, message: '' })}
          title="Click to dismiss"
        >
          <h3>Upgrade to PRO</h3>
          <p>{gatePopup.message}</p>
        </div>
      )}
    </div>
  );
}

export default ParentDashboard;
