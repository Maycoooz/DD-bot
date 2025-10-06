import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/ParentViewChildAccounts.css';
import '../styles/AuthForm.css';

function ViewChildAccounts() {
    // --- STATE MANAGEMENT ---
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // State for the in-line editing feature
    const [editingChildId, setEditingChildId] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    
    // State to hold all possible interests for the dropdown
    const [availableInterests, setAvailableInterests] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch both children and interests at the same time
                const [childrenResponse, interestsResponse] = await Promise.all([
                    api.get('/parent/my-children'),
                    api.get('/parent/interests')
                ]);
                setChildren(childrenResponse.data);
                setAvailableInterests(interestsResponse.data);
            } catch (err) {
                console.error("Failed to fetch initial data:", err);
                setError('Could not load page data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []); // Run once on component mount

    // --- EVENT HANDLERS FOR EDITING ---
    const handleEditClick = (child) => {
        setEditingChildId(child.id);
        // Pre-populate the form, converting interests to a simple array of names
        setEditFormData({
            ...child,
            interests: child.interests.map(interest => interest.name)
        });
    };

    const handleCancelClick = () => {
        setEditingChildId(null);
        setIsDropdownOpen(false); // Close dropdown on cancel
    };

    const handleEditFormChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleEditInterestsChange = (interestName) => {
        const currentInterests = editFormData.interests;
        const newInterests = currentInterests.includes(interestName)
            ? currentInterests.filter((item) => item !== interestName)
            : [...currentInterests, interestName];
        setEditFormData({ ...editFormData, interests: newInterests });
    };

    const handleSaveClick = async () => {
        try {
            const childId = editFormData.id;
            const response = await api.put(`/parent/update-child/${childId}`, editFormData);
            
            const updatedChildren = children.map((child) =>
                child.id === childId ? response.data : child
            );
            setChildren(updatedChildren);
            
            // Exit edit mode
            setEditingChildId(null);
            setIsDropdownOpen(false);
        } catch (err) {
            console.error("Failed to update child:", err);
            setError("Failed to save changes. Please try again.");
        }
    };

    // --- JSX RENDERING ---
    if (loading) return <div className="loading-state">Loading child accounts...</div>;
    if (error) return <div className="error-state">{error}</div>;

    return (
        <div className="main-content-card">
            <h2>View Child Accounts</h2>
            <form onSubmit={(e) => e.preventDefault()}>
                <table className="child-accounts-table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>First Name</th>
                            <th>Last Name</th>
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
                            editingChildId === child.id ? (
                                // --- EDITABLE ROW ---
                                <tr key={child.id} className="editing-row">
                                    <td><input type="text" name="username" value={editFormData.username} onChange={handleEditFormChange} /></td>
                                    <td><input type="text" name="first_name" value={editFormData.first_name} onChange={handleEditFormChange} /></td>
                                    <td><input type="text" name="last_name" value={editFormData.last_name} onChange={handleEditFormChange} /></td>
                                    <td><input type="date" name="birthday" value={editFormData.birthday || ''} onChange={handleEditFormChange} /></td>
                                    <td><input type="text" name="country" value={editFormData.country || ''} onChange={handleEditFormChange} /></td>
                                    <td><input type="text" name="gender" value={editFormData.gender || ''} onChange={handleEditFormChange} /></td>
                                    <td><input type="text" name="race" value={editFormData.race || ''} onChange={handleEditFormChange} /></td>
                                    <td>
                                        <div className="custom-dropdown">
                                            <button type="button" onClick={() => setIsDropdownOpen(prev => !prev)} className="dropdown-button">
                                                {editFormData.interests.length} selected
                                                <span className="dropdown-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
                                            </button>
                                            {isDropdownOpen && (
                                                <div className="dropdown-panel">
                                                    {availableInterests.map((interest) => (
                                                        <label key={interest.name} className="dropdown-item">
                                                            <input
                                                                type="checkbox"
                                                                checked={editFormData.interests.includes(interest.name)}
                                                                onChange={() => handleEditInterestsChange(interest.name)}
                                                            />
                                                            {interest.name}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <button type="button" className="action-button save" onClick={handleSaveClick}>Save</button>
                                        <button type="button" className="action-button cancel" onClick={handleCancelClick}>Cancel</button>
                                    </td>
                                </tr>
                            ) : (
                                // --- DISPLAY ROW ---
                                <tr key={child.id}>
                                    <td>{child.username}</td>
                                    <td>{child.first_name}</td>
                                    <td>{child.last_name}</td>
                                    <td>{child.birthday || 'N/A'}</td>
                                    <td>{child.country || 'N/A'}</td>
                                    <td>{child.gender || 'N/A'}</td>
                                    <td>{child.race || 'N/A'}</td>
                                    <td>{child.interests.map(i => i.name).join(', ')}</td>
                                    <td>
                                        <button className="action-button edit" onClick={() => handleEditClick(child)}>Edit</button>
                                        <button className="action-button delete">Delete</button>
                                    </td>
                                </tr>
                            )
                        ))}
                    </tbody>
                </table>
            </form>
        </div>
    );
}

export default ViewChildAccounts;