import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/AdminViewLibrarian.css';

function ViewLibrarianModal({ librarian, onClose, onDelete }) {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await api.get(`/admin/view-librarian/${librarian.id}`);
                setDetails(response.data);
            } catch (err) {
                setError('Failed to load librarian details.');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [librarian.id]);

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete librarian '${librarian.username}' and all their contributions? This action cannot be undone.`)) {
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
                    <h3>{librarian.username}</h3>
                    <button onClick={onClose} className="btn-back">Back</button>
                </div>
                <div className="modal-body">
                    {loading ? <p>Loading details...</p> : error ? <p className="error-state">{error}</p> : (
                        <>
                            <div className="media-section">
                                <h4>Books Added ({details?.books.length || 0})</h4>
                                <ul className="media-list">
                                    {details?.books.map(book => <li key={book.id}>{book.title}</li>)}
                                </ul>
                            </div>
                            <div className="media-section">
                                <h4>Videos Added ({details?.videos.length || 0})</h4>
                                <ul className="media-list">
                                    {details?.videos.map(video => <li key={video.id}>{video.title}</li>)}
                                </ul>
                            </div>
                        </>
                    )}
                </div>
                <div className="modal-footer">
                    <p className="warning-text">Warning! Deleting this librarian will also permanently delete all books and videos they have added.</p>
                    <button onClick={handleDelete} className="btn-delete">Delete Librarian</button>
                </div>
            </div>
        </div>
    );
}

export default ViewLibrarianModal;