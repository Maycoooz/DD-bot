import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import '../styles/AdminManageUsers.css';

function AdminManageUsers() {
    const navigate = useNavigate();
    
    // --- STATE MANAGEMENT ---
    const [allUsers, setAllUsers] = useState([]);
    const [stats, setStats] = useState({ totalUsers: 0, totalParents: 0, totalKids: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/admin/viewAllUsers');
                // Corrected to match the key from your last backend example
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

    // --- USER FILTERING LOGIC ---
    const filteredUsers = useMemo(() => {
        if (!searchTerm) {
            return allUsers;
        }
        return allUsers.filter(user =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allUsers, searchTerm]);

    if (loading) return <div className="loading-state">Loading user data...</div>;
    if (error) return <div className="error-state">{error}</div>;

    return (
        <>
            <h2>Manage Users</h2>

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
                            <th>First Name</th>
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
                                <td>{user.first_name}</td>
                                <td className={`role-${user.role?.name.toLowerCase()}`}>{user.role?.name}</td>
                                <td>{user.tier || 'FREE'}</td>
                                <td>{user.is_verified ? 'Active' : 'Pending'}</td>
                                <td>
                                    {/* The navigate function for this button is still needed */}
                                    <button className="btn-view" onClick={() => navigate(`/admin/view-user/${user.id}`)}>View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default AdminManageUsers;