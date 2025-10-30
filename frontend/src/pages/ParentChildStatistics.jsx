// src/components/ParentChildStatistics.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/ParentChildStatistics.css';

function ParentChildStatistics({ onNavigate }) {
  const [parentTier, setParentTier] = useState(null);
  const [childrenList, setChildrenList] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalFavoritesWeek: 0,
    totalFavoritesToday: 0,
    topCategory: 'N/A',
  });
  const [favoritesForSelected, setFavoritesForSelected] = useState([]);
  const [last3Favorites, setLast3Favorites] = useState([]);

  const isFreeParent =
    (typeof parentTier === 'string'
      ? parentTier
      : parentTier?.value || parentTier?.name || 'FREE') === 'FREE';

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, kidsRes] = await Promise.all([
          api.get('/parent/me'),
          api.get('/parent/my-children'),
        ]);

        const tierRaw = meRes.data?.tier;
        const tier =
          typeof tierRaw === 'string'
            ? tierRaw
            : tierRaw?.value || tierRaw?.name || 'FREE';
        setParentTier((tier || 'FREE').toUpperCase());

        const children = Array.isArray(kidsRes.data) ? kidsRes.data : [];
        setChildrenList(children);
        if (children.length > 0) setSelectedChildId(children[0].id);
      } catch (err) {
        console.error('Failed to load parent/children', err);
        setError('Failed to load data.');
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedChildId || isFreeParent) {
      setLoading(false);
      return;
    }

    const fetchChildStats = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/favorite/${selectedChildId}`);
        const favs = Array.isArray(res.data) ? res.data : [];

        const now = new Date();
        const todayStr = now.toDateString();
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);

        const favoritesToday = favs.filter((f) => {
          if (!f.created_at) return false;
          try {
            return new Date(f.created_at).toDateString() === todayStr;
          } catch {
            return false;
          }
        });

        const favoritesWeek = favs.filter((f) => {
          if (!f.created_at) return false;
          try {
            return new Date(f.created_at) >= oneWeekAgo;
          } catch {
            return false;
          }
        });

        const categoryCount = {};
        favs.forEach((f) => {
          const cat = f.category || f.type || 'Unknown';
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });
        const topCategory =
          Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] ||
          'N/A';

        const sortedByDate = [...favs].sort((a, b) => {
          const da = a.created_at ? new Date(a.created_at).getTime() : 0;
          const db = b.created_at ? new Date(b.created_at).getTime() : 0;
          return db - da;
        });
        const lastThree = sortedByDate.slice(0, 3);

        setStats({
          totalFavoritesWeek: favoritesWeek.length,
          totalFavoritesToday: favoritesToday.length,
          topCategory,
        });
        setLast3Favorites(lastThree);
        setFavoritesForSelected(favs);
        setError('');
      } catch (err) {
        console.error('Failed to load favorites for child', err);
        setStats({
          totalFavoritesWeek: 0,
          totalFavoritesToday: 0,
          topCategory: 'N/A',
        });
        setLast3Favorites([]);
        setFavoritesForSelected([]);
        setError('Failed to load favorites for selected child.');
      } finally {
        setLoading(false);
      }
    };

    fetchChildStats();
  }, [selectedChildId, isFreeParent]);

  const goToProfile = () => {
    if (typeof onNavigate === 'function') {
      onNavigate('profile');
      return;
    }
    // Fallback: broadcast to dashboard
    try {
      window.dispatchEvent(new CustomEvent('PD_NAV', { detail: 'profile' }));
    } catch {
      /* no-op */
    }
  };

  if (error) {
    return (
      <div className="parent-stats-container">
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  if (childrenList.length === 0) {
    return (
      <div className="parent-stats-container">
        <p>No children linked to your account.</p>
      </div>
    );
  }

  return (
    <div className="parent-stats-container">
      <h2>📊 Child Activity Overview</h2>

      <div className={`psc-card ${isFreeParent ? 'psc-disabled' : ''}`}>
        <div className="psc-body">
          <div className="child-select">
            <label>Select Child: </label>
            <select
              value={selectedChildId || ''}
              onChange={(e) => setSelectedChildId(Number(e.target.value))}
              disabled={isFreeParent}
            >
              {childrenList.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.first_name} {child.last_name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p>Loading statistics...</p>
          ) : (
            <>
              <div className="stats-summary">
                <div className="stat-card">
                  <h4>⭐ Favorites Added Today</h4>
                  <p>{stats.totalFavoritesToday}</p>
                </div>
                <div className="stat-card">
                  <h4>📅 Favorites This Week</h4>
                  <p>{stats.totalFavoritesWeek}</p>
                </div>
                <div className="stat-card">
                  <h4>📚 Top Category</h4>
                  <p>{stats.topCategory}</p>
                </div>
              </div>

              <div className="recent-favorites">
                <h3>🕮 Last 3 Favorites</h3>
                {last3Favorites.length > 0 ? (
                  <ul>
                    {last3Favorites.map((f) => (
                      <li key={f.id}>
                        {f.type?.toLowerCase() === 'book' ? '📘' : '🎬'}{' '}
                        <strong>{f.title}</strong>
                        {f.created_at ? (
                          <span> · {new Date(f.created_at).toLocaleString()}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No favorites recorded yet.</p>
                )}
              </div>

              <div className="selected-child-favorites" style={{ marginTop: 20 }}>
                <h3>Favorites for Selected Child</h3>
                {favoritesForSelected.length > 0 ? (
                  <ul>
                    {favoritesForSelected.map((f) => (
                      <li key={f.id}>
                        {f.type?.toLowerCase() === 'book' ? '📚' : '🎞️'} {f.title}
                        {f.created_at ? (
                          <span> · {new Date(f.created_at).toLocaleDateString()}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No favorites for this child.</p>
                )}
              </div>
            </>
          )}
        </div>

        {isFreeParent && (
          <div className="psc-overlay" aria-hidden="false">
            <div className="psc-overlay-content">
              <h3>Upgrade to PRO to view Statistics</h3>
              <p>
                Your current plan is <strong>FREE</strong>. Child statistics are a PRO
                feature. Upgrade to enable this page.
              </p>
              <button
                type="button"
                className="psc-upgrade-btn"
                onClick={goToProfile}
              >
                Go to Profile to Upgrade
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ParentChildStatistics;
