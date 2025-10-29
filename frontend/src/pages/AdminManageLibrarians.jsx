import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import AdminViewLibrarian from './AdminViewLibrarian';
import '../styles/AdminManageLibrarians.css';

function AdminManageLibrarians() {
  // data + loading/error state
  const [librarians, setLibrarians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingActionId, setPendingActionId] = useState(null);
  const [error, setError] = useState('');

  // search + pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);

  // modal for "View Librarian"
  const [selectedLibrarian, setSelectedLibrarian] = useState(null);

  // Fetch librarians from the backend with pagination
  const fetchLibrarians = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/librarians', {
        params: {
          search: searchTerm,
          page,
          page_size: pageSize,
        },
      });

      // expecting backend to return:
      // { items: [...], total: <int>, page: <int>, page_size: <int> }
      const {
        items = [],
        total = 0,
        page: respPage = page,
      } = data || {};

      setLibrarians(items);

      const pages = Math.max(1, Math.ceil(total / pageSize));
      setTotalPages(pages);

      // sync current page to backend-reported page
      setPage(respPage);
    } catch (err) {
      console.error('Failed to fetch librarians:', err);
      setError('Failed to load librarians.');
    } finally {
      setLoading(false);
    }
  };

  // Refetch when search or page changes
  useEffect(() => {
    fetchLibrarians();
  }, [page, searchTerm]);

  // ---- Handlers ----

  // open modal
  const handleView = (lib) => {
    setSelectedLibrarian(lib);
  };

  const handleCloseModal = () => {
    setSelectedLibrarian(null);
  };

  // Approve / Unapprove librarian
  // Uses backend toggle: PATCH /admin/librarians/{id}/verify
  const handleToggleVerify = async (lib) => {
    try {
      setPendingActionId(lib.id);
      setError('');

      // server flips librarian_verified internally and returns updated row
      const { data: updatedLibrarian } = await api.patch(
        `/admin/librarians/${lib.id}/verify`
      );

      // Update local state with the response
      setLibrarians((prev) =>
        prev.map((row) =>
          row.id === lib.id ? { ...row, ...updatedLibrarian } : row
        )
      );
    } catch (err) {
      console.error('Failed to update approval status:', err);
      setError('Failed to update approval status.');
    } finally {
      setPendingActionId(null);
    }
  };

  // Delete librarian
  const handleDelete = async (lib) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete librarian "${lib.username}"?`
    );
    if (!confirmDelete) return;

    try {
      setPendingActionId(lib.id);
      setError('');

      // DELETE /admin/librarians/{id}
      await api.delete(`/admin/librarians/${lib.id}`);

      // remove from current view
      setLibrarians((prev) => prev.filter((row) => row.id !== lib.id));
    } catch (err) {
      console.error('Failed to delete librarian:', err);
      setError('Failed to delete librarian.');
    } finally {
      setPendingActionId(null);
    }
  };

  const handleSearchInput = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // reset to first page when changing search
  };

  const handlePrevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };

  // helper so don't repeat badge logic inline:
  const renderEmailVerifiedBadge = (isVerified) => {
    if (isVerified) {
      return (
        <span className="status-approved">
          Verified
        </span>
      );
    }
    return (
        <span className="status-pending">
          Pending
        </span>
    );
  };

  const renderAdminApprovedBadge = (isApproved) => {
    if (isApproved) {
      return (
        <span className="status-approved">
          Approved
        </span>
      );
    }
    return (
      <span className="status-pending">
        Pending
      </span>
    );
  };

  // ---- Render ----

  return (
    <div className="librarians-page-wrapper">
      <div className="librarians-card">
        <div className="card-header-row">
          <h2 className="card-title">Manage Librarians</h2>

          <div className="search-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Search name, username, or email"
              value={searchTerm}
              onChange={handleSearchInput}
            />
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="table-scroll-wrapper">
          <table className="librarians-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username / Email</th>
                <th>Email Verified</th>
                <th>Admin Approved</th>
                <th className="actions-header-cell">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="loading-row">
                    Loading librarians...
                  </td>
                </tr>
              ) : librarians.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-results">
                    No librarians found.
                  </td>
                </tr>
              ) : (
                librarians.map((lib) => (
                  <tr key={lib.id}>
                    <td>
                      <div className="name-cell">
                        <strong>
                          {lib.first_name} {lib.last_name}
                        </strong>
                        <div className="role-badge">{lib.role_name}</div>
                      </div>
                    </td>

                    <td>
                      <div className="user-contact">
                        <div>{lib.username}</div>
                        <div className="email-text">
                          {lib.email || 'no email'}
                        </div>
                      </div>
                    </td>

                    {/* EMAIL VERIFIEDc colum shows Verified / Pending */}
                    <td>
                      {renderEmailVerifiedBadge(lib.is_verified)}
                    </td>

                    {/* ADMIN APPROVED column shows Approved / Pending */}
                    <td>
                      {renderAdminApprovedBadge(lib.librarian_verified)}
                    </td>

                    <td className="actions-cell">
                      <button
                        className="btn-view"
                        onClick={() => handleView(lib)}
                      >
                        View
                      </button>

                      <button
                        className="btn-approve"
                        disabled={pendingActionId === lib.id}
                        onClick={() => handleToggleVerify(lib)}
                      >
                        {lib.librarian_verified ? 'Unapprove' : 'Approve'}
                      </button>

                      <button
                        className="btn-delete"
                        disabled={pendingActionId === lib.id}
                        onClick={() => handleDelete(lib)}
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

        {/* Pagination footer */}
        <div className="pagination-row">
          <button
            className="pager-btn"
            onClick={handlePrevPage}
            disabled={page <= 1}
          >
            Previous
          </button>

          <div className="pager-info">
            Page {page} of {totalPages}
          </div>

          <button
            className="pager-btn"
            onClick={handleNextPage}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {/* Details modal */}
      {selectedLibrarian && (
        <AdminViewLibrarian
          librarian={selectedLibrarian}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default AdminManageLibrarians;
