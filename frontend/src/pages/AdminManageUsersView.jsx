import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import '../styles/AdminManageUsersView.css';

function AdminManageUsersView({ user, onClose, onDeleteUser }) {
  const [children, setChildren] = useState([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [childError, setChildError] = useState('');

  if (!user) return null;

  // helper: decide which email to show
  const getDisplayEmail = () => {
    if (user.role_name === 'CHILD' && user.parent_email) {
      return user.parent_email;
    }
    return user.email || 'no email';
  };

  const fullName =
    [user.first_name || '', user.last_name || ''].join(' ').trim() ||
    '(no name provided)';

  const renderStatusChip = () => {
    if (user.is_verified) {
      return <span className="status-chip status-active">Active</span>;
    }
    return <span className="status-chip status-pending">Pending</span>;
  };

  // Fetch children for parents
  useEffect(() => {
    const fetchChildren = async () => {
      if (!user || user.role_name !== 'PARENT') {
        setChildren([]);
        return;
      }

      setLoadingChildren(true);
      setChildError('');
      try {
        const res = await api.get(`/admin/parents/${user.id}/children`);
        setChildren(res.data || []);
      } catch (err) {
        console.error('Failed to load child accounts:', err);
        setChildError('Failed to load child accounts.');
      } finally {
        setLoadingChildren(false);
      }
    };

    fetchChildren();
  }, [user]);

  // helper: initials for avatar circle
  const getInitials = (first, last) => {
    const a = (first || '').trim()[0] || '';
    const b = (last || '').trim()[0] || '';
    const initials = (a + b).toUpperCase();
    return initials || '👤';
  };

  return (
    <div className="view-modal-overlay">
      <div className="view-modal-card">
        {/* Header row */}
        <div className="view-modal-header">
          <h2 className="view-modal-title">View User</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Basic info grid */}
        <div className="user-info-grid">
          <div className="info-block">
            <div className="info-label">Username</div>
            <div className="info-value">{user.username}</div>
          </div>

          <div className="info-block">
            <div className="info-label">Name</div>
            <div className="info-value">{fullName}</div>
          </div>

          <div className="info-block">
            <div className="info-label">
              {user.role_name === 'CHILD' ? 'Parent Email' : 'Email'}
            </div>
            <div className="info-value">{getDisplayEmail()}</div>
          </div>

          <div className="info-block">
            <div className="info-label">Role</div>
            <div className="info-value">
              <span
                className={`role-badge role-${user.role_name?.toLowerCase()}`}
              >
                {user.role_name}
              </span>
            </div>
          </div>

          <div className="info-block">
            <div className="info-label">Tier</div>
            <div className="info-value">{user.subscription_tier || 'FREE'}</div>
          </div>

          <div className="info-block">
            <div className="info-label">Email Verified</div>
            <div className="info-value">{renderStatusChip()}</div>
          </div>
        </div>

        {/* Child accounts section (parents only) */}
        {user.role_name === 'PARENT' && (
          <div className="child-section">
            <h3 className="child-section-title">Child Accounts</h3>

            {loadingChildren ? (
              <div className="child-loading">Loading child accounts…</div>
            ) : childError ? (
              <div className="child-error">{childError}</div>
            ) : children.length === 0 ? (
              <div className="child-empty">No child accounts found.</div>
            ) : (
              <ul className="child-list">
                {children.map((kid) => {
                  const kidFullName = [
                    kid.first_name || '',
                    kid.last_name || '',
                  ]
                    .join(' ')
                    .trim() || '(no name)';
                  const initials = getInitials(kid.first_name, kid.last_name);

                  return (
                    <li className="child-row" key={kid.id}>
                      <div className="child-avatar">{initials}</div>
                      <div className="child-details">
                        <div className="child-line">
                          <span className="child-label">Username:</span>
                          <span className="child-value">{kid.username}</span>
                        </div>
                        <div className="child-line">
                          <span className="child-label">Name:</span>
                          <span className="child-value">{kidFullName}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Danger zone */}
        <div className="danger-zone">
          <p className="danger-hint">
            {user.role_name === 'PARENT'
              ? 'Deleting this parent will also delete all of their child accounts.'
              : 'This action cannot be undone.'}
          </p>

          <button
            className="btn-delete-full"
            onClick={() => onDeleteUser(user)}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminManageUsersView;
