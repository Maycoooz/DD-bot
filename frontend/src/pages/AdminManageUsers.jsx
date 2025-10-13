import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import '../styles/AdminManageUsers.css';
import AdminManageUsersView from './AdminManageUsersView';

function AdminManageUsers() {
    const navigate = useNavigate();
    
    const [allUsers, setAllUsers] = useState([]);
    const [stats, setStats] = useState({ totalUsers: 0, totalParents: 0, totalKids: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingUser, setViewingUser] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/admin/view-all-users');
                const { parent_and_kid_users, total_users, total_parents, total_kids } = response.data;
                setAllUsers(parent_and_kid_users || []);
                setStats({
                    totalUsers: total_users || 0,
                    totalParents: total_parents || 0,
                    totalKids: total_kids || 0,
                });
            } catch (err) {
                console.error("Failed to fetch users:", err);
                setError('Could not load user data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        if (!searchTerm) {
            return allUsers;
        }
        return allUsers.filter(user =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allUsers, searchTerm]);

    const handleDeleteUser = async (userToDelete) => {
        try {
            const response = await api.delete(`/admin/delete-user/${userToDelete.id}`);
            
            let updatedUsers = allUsers.filter(u => u.id !== userToDelete.id);
            if (userToDelete.role.name === 'PARENT') {
                updatedUsers = updatedUsers.filter(u => u.primary_parent_id !== userToDelete.id);
            }
            
            setAllUsers(updatedUsers);
            setSuccess(response.data.message);
            setError('');
            setViewingUser(null);

        } catch (err) {
            console.error("Failed to delete user:", err);
            setError(err.response?.data?.detail || "Failed to delete the account.");
            setSuccess('');
            setViewingUser(null);
        }
    };

    if (loading) return <div className="loading-state">Loading user data...</div>;

    return (
        <>
            <h1>Manage Users</h1>
            
            {error && <div className="error-state">{error}</div>}
            {success && <div className="success-state">{success}</div>}

            <div className="stats-and-search">
                <div className="stats-summary">
                    <span>Total Parents & Kids: {stats.totalUsers}</span>
                    <span>Parents: {stats.totalParents}</span>
                    <span>Kids: {stats.totalKids}</span>
                </div>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search by Username"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Tier</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id}>
                                <td>{user.username}</td>
                                <td className={`role-${user.role?.name.toLowerCase()}`}>{user.role?.name}</td>
                                <td>{user.tier || 'FREE'}</td>
                                <td>{user.is_verified ? 'Active' : 'Pending'}</td>
                                <td>
                                    <button className="btn-view" onClick={() => setViewingUser(user)}>
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {viewingUser && (
                <AdminManageUsersView 
                    user={viewingUser} 
                    allUsers={allUsers}
                    onClose={() => setViewingUser(null)} 
                    onDeleteUser={handleDeleteUser}
                />
            )}
        </>
    );
}

export default AdminManageUsers;