import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/AdminViewLibrarian.css';

const PaginatedMediaTable = ({ title, fetchFunction }) => {
    const [data, setData] = useState({ items: [], total: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const size = 5; // 5 items per page

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetchFunction(currentPage, size);
                setData(response.data);
            } catch (error) {
                console.error(`Failed to fetch ${title}:`, error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentPage, fetchFunction, title]);

    const totalPages = Math.ceil(data.total / size);

    return (
        <div className="media-section">
            <h4>{title} ({data.total})</h4>
            {loading ? <p>Loading...</p> : (
                <>
                    <table className="media-table-modal">
                        <thead><tr><th>Title</th></tr></thead>
                        <tbody>
                            {data.items.length > 0 ? data.items.map(item => (
                                <tr key={item.id}><td>{item.title}</td></tr>
                            )) : <tr><td>No items found.</td></tr>}
                        </tbody>
                    </table>
                    <div className="pagination-controls-modal">
                        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Prev</button>
                        <span>Page {currentPage} of {totalPages || 1}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>Next</button>
                    </div>
                </>
            )}
        </div>
    );
};

function ViewLibrarianModal({ librarian, onClose, onDelete }) {
    const [error, setError] = useState('');

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete librarian '${librarian.username}' and all their contributions? This is irreversible.`)) {
            try {
                await api.delete(`/admin/delete-librarian/${librarian.id}`);
                onDelete(librarian.id);
            } catch (err) {
                setError(err.response?.data?.detail || 'Failed to delete librarian.');
            }
        }
    };

    return (
        <div className="modal-overlay">
            <div className="view-librarian-modal">
                <div className="modal-header">
                    <h3>View Librarian</h3>
                    <button onClick={onClose} className="btn-back">Back</button>
                </div>
                <div className="librarian-details">
                    <div><label>Username</label><span>{librarian.username}</span></div>
                    <div><label>First Name</label><span>{librarian.first_name}</span></div>
                    <div><label>Last Name</label><span>{librarian.last_name}</span></div>
                    <div><label>Email Verified</label><span>{librarian.is_verified ? 'Yes' : 'No'}</span></div>
                    <div><label>Admin Approved</label><span>{librarian.librarian_verified ? 'Yes' : 'No'}</span></div>
                </div>
                <div className="modal-body">
                    {error && <p className="error-state">{error}</p>}
                    <PaginatedMediaTable 
                        title="Books Added"
                        fetchFunction={(page, size) => api.get(`/admin/librarian/${librarian.id}/books`, { params: { page, size } })}
                    />
                    <PaginatedMediaTable 
                        title="Videos Added"
                        fetchFunction={(page, size) => api.get(`/admin/librarian/${librarian.id}/videos`, { params: { page, size } })}
                    />
                </div>
                <div className="modal-footer">
                    <button onClick={handleDelete} className="btn-delete">Delete Librarian</button>
                </div>
            </div>
        </div>
    );
}

export default ViewLibrarianModal;