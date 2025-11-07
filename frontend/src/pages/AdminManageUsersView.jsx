import React, { useEffect, useRef, useState } from 'react';
import api from '../api/axiosConfig';
import '../styles/AdminManageUsersView.css';

function AdminManageUsersView({ user, onClose, onDeleteUser }) {
  const [children, setChildren] = useState([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [childError, setChildError] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const cardRef = useRef(null);

  if (!user) return null;

  // ===== Helpers =====
  const fullName =
    [user.first_name || '', user.last_name || ''].join(' ').trim() ||
    '(no name provided)';

  const getDisplayEmail = () => {
    if (user.role_name === 'CHILD' && user.parent_email) return user.parent_email;
    return user.email || 'no email';
  };

  const getInitials = (first, last) => {
    const a = (first || '').trim()[0] || '';
    const b = (last || '').trim()[0] || '';
    const initials = (a + b).toUpperCase();
    return initials || '👤';
  };

  const renderStatusChip = () =>
    user.is_verified ? (
      <span className="status-chip status-active">Active</span>
    ) : (
      <span className="status-chip status-pending">Pending</span>
    );

  // ===== Fetch children for parents =====
  useEffect(() => {
    let cancelled = false;
    const fetchChildren = async () => {
      if (user.role_name !== 'PARENT') {
        setChildren([]);
        return;
      }
      setLoadingChildren(true);
      setChildError('');
      try {
        const res = await api.get(`/admin/parents/${user.id}/children`);
        if (!cancelled) setChildren(res.data || []);
      } catch (err) {
        console.error('Failed to load child accounts:', err);
        if (!cancelled) setChildError('Failed to load child accounts.');
      } finally {
        if (!cancelled) setLoadingChildren(false);
      }
    };
    fetchChildren();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // ===== Close on Esc (or cancel confirm) =====
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (isConfirmingDelete) setIsConfirmingDelete(false);
        else onClose?.();
      }
      if (isConfirmingDelete && e.key === 'Enter') {
        onDeleteUser?.(user);
        setIsConfirmingDelete(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isConfirmingDelete, onClose, onDeleteUser, user]);

  // ===== Click outside to close (disabled while confirming) =====
  const onOverlayMouseDown = (e) => {
    if (isConfirmingDelete) return;
    if (cardRef.current && !cardRef.current.contains(e.target)) onClose?.();
  };

  return (
    <div className="view-modal-overlay" onMouseDown={onOverlayMouseDown} role="dialog" aria-modal="true">
      <div
        className="view-modal-card"
        ref={cardRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="view-modal-header">
          <h2 className="view-modal-title">View User</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Info grid */}
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
            <div className="info-label">{user.role_name === 'CHILD' ? 'Parent Email' : 'Email'}</div>
            <div className="info-value">{getDisplayEmail()}</div>
          </div>

          <div className="info-block">
            <div className="info-label">Role</div>
            <div className="info-value">
              <span className={`role-badge role-${user.role_name?.toLowerCase()}`}>{user.role_name}</span>
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

        {/* Child accounts (parents only) */}
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
                  const kidFullName =
                    [kid.first_name || '', kid.last_name || ''].join(' ').trim() || '(no name)';
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

          {!isConfirmingDelete ? (
            <button className="btn-delete-full" onClick={() => setIsConfirmingDelete(true)}>
              Delete Account
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-delete-full"
                onClick={() => {
                  onDeleteUser?.(user);
                  setIsConfirmingDelete(false);
                }}
                autoFocus
              >
                Confirm Delete
              </button>
              <button className="close-btn" onClick={() => setIsConfirmingDelete(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminManageUsersView;
