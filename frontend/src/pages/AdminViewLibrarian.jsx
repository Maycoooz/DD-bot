import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/AdminViewLibrarian.css';
import ConfirmationModal from './ConfirmationModal';

// A reusable component for paginated media tables
const PaginatedMediaTable = ({ title, fetchFunction }) => {
    const [data, setData] = useState({ items: [], total: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const size = 5;

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
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.length > 0 ? data.items.map(item => (
                                <tr key={item.id}>
                                    <td>{item.title}</td>
                                    <td>
                                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                                            Open Link to Media
                                        </a>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="2">No items found.</td>
                                </tr>
                            )}
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

function ViewLibrarianModal({ librarian, onClose, onDelete, onApprove }) {
    const [error, setError] = useState('');
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isConfirmingApprove, setIsConfirmingApprove] = useState(false);

    const handleConfirmDelete = async () => {
        try {
            await api.delete(`/admin/delete-librarian/${librarian.id}`);
            onDelete(librarian.id);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete librarian.');
        } finally {
            setIsConfirmingDelete(false);
        }
    };

    const handleConfirmApprove = () => {
        onApprove(librarian);
        setIsConfirmingApprove(false);
    };

    return (
        <>
            <div className="modal-overlay">
                <div className="view-librarian-modal">
                    <div className="modal-header">
                        <h3>View Librarian</h3>
                        <button onClick={onClose} className="btn-back">Back</button>
                    </div>
                    <div className="librarian-details">
                        <div><label>Username</label><span>{librarian.username}</span></div>
                        <div><label>Name</label><span>{`${librarian.first_name} ${librarian.last_name}`}</span></div>
                        <div><label>Email</label><span>{librarian.email || 'N/A'}</span></div>
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
                        {!librarian.librarian_verified && (
                            <button onClick={() => setIsConfirmingApprove(true)} className="btn-approve">Approve Librarian</button>
                        )}
                        <button onClick={() => setIsConfirmingDelete(true)} className="btn-delete">Delete Librarian</button>
                    </div>
                </div>
            </div>

            {isConfirmingDelete && (
                <ConfirmationModal
                    message={`Are you sure you want to delete librarian '${librarian.username}' and all their contributions?`}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setIsConfirmingDelete(false)}
                />
            )}

            {isConfirmingApprove && (
                <ConfirmationModal
                    message={`Are you sure you want to approve librarian '${librarian.username}'?`}
                    onConfirm={handleConfirmApprove}
                    onCancel={() => setIsConfirmingApprove(false)}
                    confirmButtonClass="btn-approve"
                />
            )}
        </>
    );
}

export default ViewLibrarianModal;