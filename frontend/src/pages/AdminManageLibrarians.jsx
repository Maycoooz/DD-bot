import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/AdminManageUsers.css'; 
import ViewLibrarianModal from './AdminViewLibrarian';

function AdminManageLibrarians() {
    const [librarians, setLibrarians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [viewingLibrarian, setViewingLibrarian] = useState(null);

    useEffect(() => {
        const fetchLibrarians = async () => {
            try {
                const response = await api.get('/admin/view-all-librarians');
                setLibrarians(response.data);
            } catch (err) {
                setError('Failed to load librarian data.');
            } finally {
                setLoading(false);
            }
        };
        fetchLibrarians();
    }, []);

    const handleDeleteLibrarian = (librarianId) => {
        setLibrarians(prev => prev.filter(lib => lib.id !== librarianId));
        setSuccess('Librarian deleted successfully.');
        setViewingLibrarian(null);
    };

    // Handler for Approving a Librarian 
    const handleApproveLibrarian = async (librarianToApprove) => {
        try {
            const response = await api.patch(`/admin/approve-librarian/${librarianToApprove.id}`);
            
            // Update the librarian in the local state to reflect the approval
            setLibrarians(prev => 
                prev.map(lib => 
                    lib.id === librarianToApprove.id ? response.data : lib
                )
            );

            setSuccess(`Librarian '${librarianToApprove.username}' has been approved.`);
            setViewingLibrarian(null); // Close the modal
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to approve librarian.");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <>
            <h2>Manage Librarians</h2>
            {error && <p className="error-state">{error}</p>}
            {success && <p className="success-state">{success}</p>}

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Email Status</th>
                            <th>Admin Approval</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {librarians.map(librarian => (
                            <tr key={librarian.id}>
                                <td>{librarian.username}</td>
                                <td>{`${librarian.first_name} ${librarian.last_name}`}</td>
                                <td>{librarian.email || 'N/A'}</td>
                                <td>{librarian.is_verified ? 'Verified' : 'Pending'}</td>
                                <td>{librarian.librarian_verified ? 'Approved' : 'Pending'}</td>
                                <td>
                                    <button className="btn-view" onClick={() => setViewingLibrarian(librarian)}>View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {viewingLibrarian && (
                <ViewLibrarianModal
                    librarian={viewingLibrarian}
                    onClose={() => setViewingLibrarian(null)}
                    onDelete={handleDeleteLibrarian}
                    onApprove={handleApproveLibrarian}
                />
            )}
        </>
    );
}

export default AdminManageLibrarians;