import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/AdminManageUsers.css';
import AdminManageUsersView from './AdminManageUsersView';

function AdminManageUsers() {
  // table data for current page
  const [users, setUsers] = useState([]);

  // global stats from backend
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalParents: 0,
    totalKids: 0,
  });

  // request / UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // modal
  const [viewingUser, setViewingUser] = useState(null);

  // search + pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);

  // refetch trigger (used after delete)
  const [refreshToggle, setRefreshToggle] = useState(false);

  // Fetch paginated parents/kids from backend
  const fetchUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get('/admin/view-all-users', {
        params: {
          page,
          size: pageSize,
          search: searchTerm || undefined,
        },
      });

      // Expected backend shape:
      // {
      //   items: [
      //     {
      //       id,
      //       username,
      //       first_name,
      //       last_name,
      //       email,
      //       role_name,            // "PARENT" | "CHILD"
      //       subscription_tier,    // e.g. "FREE" | "PREMIUM"
      //       is_verified,          // <-- boolean
      //       parent_email          // only for CHILD rows
      //     },
      //     ...
      //   ],
      //   total_accounts,
      //   total_parents,
      //   total_kids,
      //   page,
      //   size,
      //   total_pages
      // }

      setUsers(data.items || []);

      setStats({
        totalAccounts: data.total_accounts ?? 0,
        totalParents: data.total_parents ?? 0,
        totalKids: data.total_kids ?? 0,
      });

      // pagination info
      setTotalPages(data.total_pages ?? 1);

      // sync current page if backend echoes it back
      if (data.page) {
        setPage(data.page);
      }

    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Could not load user data.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch whenever page/search changes or refreshToggle flips
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, refreshToggle]);

  // Delete user (and children if parent)
  const handleDeleteUser = async (userToDelete) => {
    const confirmDelete = window.confirm(
      userToDelete.role_name === 'PARENT'
        ? `Are you sure you want to delete parent "${userToDelete.username}" and ALL their child accounts?`
        : `Are you sure you want to delete "${userToDelete.username}"?`
    );
    if (!confirmDelete) return;

    try {
      setError('');
      setSuccess('');

      await api.delete(`/admin/delete-user/${userToDelete.id}`);

      // Just refetch after delete so everything stays in sync
      setRefreshToggle((t) => !t);
      setViewingUser(null);
      setSuccess('Account deleted successfully.');
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError(
        err.response?.data?.detail ||
          'Failed to delete this account.'
      );
      setViewingUser(null);
    }
  };

  // Pagination handlers
  const handlePrevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };

  // Which email to display in the table
  // - CHILD: show parent's email if available
  // - otherwise user's own email
  const resolveDisplayEmail = (user) => {
    if (user.role_name === 'CHILD' && user.parent_email) {
      return user.parent_email;
    }
    return user.email || 'no email';
  };

  // Email verified chip (is_verified === true => Active, else Pending)
  const renderVerifiedChip = (isVerified) => {
    if (isVerified) {
      return (
        <span className="status-chip status-active">Verified</span>
      );
    }
    return (
      <span className="status-chip status-pending">Pending</span>
    );
  };

  return (
    <div className="manage-users-wrapper">
      {/* --- main card --- */}
      <div className="manage-users-card">
        <div className="card-header-row">
          <h2 className="card-title">Manage Parents & Kids</h2>

          <div className="search-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Search name, username, or email"
              value={searchTerm}
              onChange={(e) => {
                setPage(1); // reset to first page whenever search changes
                setSearchTerm(e.target.value);
              }}
            />
          </div>
        </div>

        {/* feedback banners */}
        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        {/* global stats chips */}
        <div className="stats-row">
          <div className="stat-chip">
            <span>Total Accounts:</span>
            <strong>{stats.totalAccounts}</strong>
          </div>
          <div className="stat-chip">
            <span>Parents:</span>
            <strong>{stats.totalParents}</strong>
          </div>
          <div className="stat-chip">
            <span>Kids:</span>
            <strong>{stats.totalKids}</strong>
          </div>
        </div>

        <div className="table-scroll-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Tier</th>
                <th>Email Verified</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="loading-state">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-results">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    {/* Username + email/parent email */}
                    <td>
                      <div className="user-main">
                        <div className="user-username">{u.username}</div>
                        <div className="user-email">
                          {resolveDisplayEmail(u)}
                        </div>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td>
                      <span
                        className={`role-badge role-${u.role_name?.toLowerCase()}`}
                      >
                        {u.role_name}
                      </span>
                    </td>

                    {/* Tier (subscription_tier) */}
                    <td className="tier-cell">
                      {u.subscription_tier || 'FREE'}
                    </td>

                    {/* Email Verified (is_verified) */}
                    <td>{renderVerifiedChip(u.is_verified)}</td>

                    {/* Actions */}
                    <td className="actions-cell">
                      <button
                        className="btn-view"
                        onClick={() => setViewingUser(u)}
                      >
                        View
                      </button>

                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteUser(u)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* pagination footer */}
        <div className="pagination-row">
          <button
            className="pager-btn"
            onClick={handlePrevPage}
            disabled={page <= 1 || loading}
          >
            Previous
          </button>

          <div className="pager-info">
            Page {page} of {totalPages}
          </div>

          <button
            className="pager-btn"
            onClick={handleNextPage}
            disabled={page >= totalPages || loading}
          >
            Next
          </button>
        </div>
      </div>

      {/* modal for viewing a user */}
      {viewingUser && (
        <AdminManageUsersView
          user={viewingUser}
          onClose={() => setViewingUser(null)}
          onDeleteUser={handleDeleteUser}
        />
      )}
    </div>
  );
}

export default AdminManageUsers;
