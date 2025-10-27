import React from 'react';
import '../styles/AdminManageUsersView.css';

function AdminManageUsersView({ user, onClose, onDeleteUser }) {
  if (!user) return null;

  // helper: determine which email to show prominently
  const getDisplayEmail = () => {
    if (user.role_name === 'CHILD' && user.parent_email) {
      return user.parent_email;
    }
    return user.email || 'no email';
  };

  const fullName = [
    user.first_name || '',
    user.last_name || ''
  ].join(' ').trim() || '(no name provided)';

  const renderStatusChip = () => {
    if (user.is_verified) {
      return (
        <span className="status-chip status-active">
          Active
        </span>
      );
    }
    return (
        <span className="status-chip status-pending">
          Pending
        </span>
    );
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
              <span className={`role-badge role-${user.role_name?.toLowerCase()}`}>
                {user.role_name}
              </span>
            </div>
          </div>

          <div className="info-block">
            <div className="info-label">Tier</div>
            <div className="info-value">{user.tier || 'FREE'}</div>
          </div>

          <div className="info-block">
            <div className="info-label">Email Verified</div>
            <div className="info-value">
              {renderStatusChip()}
            </div>
          </div>
        </div>

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
