// src/components/ViewChildAccounts.js

import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/ParentViewChildAccounts.css';

function ViewChildAccounts() {
    // State for the list of children, loading status, and any errors
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchChildren = async () => {
            try {
                // Call the endpoint to get the children for the logged-in parent
                const response = await api.get('/parent/my-children');
                setChildren(response.data);
            } catch (err) {
                console.error("Failed to fetch child accounts:", err);
                setError('Could not load child accounts. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchChildren();
    }, []); // Empty array ensures this runs only once

    if (loading) {
        return <div className="loading-state">Loading child accounts...</div>;
    }

    if (error) {
        return <div className="error-state">{error}</div>;
    }

    return (
        <div className="main-content-card">
            <h2>View Child Accounts</h2>
            
            {children.length === 0 ? (
                <p>You have not created any child accounts yet.</p>
            ) : (
                <table className="child-accounts-table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Name</th>
                            <th>Birthday</th>
                            <th>Country</th>
                            <th>Gender</th>
                            <th>Race</th>
                            <th>Interests</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {children.map((child) => (
                            <tr key={child.id}>
                                <td>{child.username}</td>
                                <td>{`${child.first_name} ${child.last_name}`}</td>
                                <td>{child.birthday}</td>
                                <td>{child.country || 'N/A'}</td>
                                <td>{child.gender || 'N/A'}</td>
                                <td>{child.race || 'N/A'}</td>
                                <td>
                                    {/* This correctly maps over the interests array */}
                                    {child.interests.map(interest => interest.name).join(', ')}
                                </td>
                                <td>
                                    <button className="action-button">Edit</button>
                                    <button className="action-button delete">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default ViewChildAccounts;