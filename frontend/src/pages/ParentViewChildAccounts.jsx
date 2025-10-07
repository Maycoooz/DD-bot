import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/ParentViewChildAccounts.css'; // This is the new CSS file.

function ViewChildAccounts() {
    // --- STATE MANAGEMENT ---
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(''); // State for success messages

    // Editing Profile State
    const [editingChildId, setEditingChildId] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Deleting Account State
    const [childToDelete, setChildToDelete] = useState(null);
    
    // Change Password State
    const [childForPasswordChange, setChildForPasswordChange] = useState(null);
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_new_password: ''
    });
    const [passwordError, setPasswordError] = useState('');

    const [availableInterests, setAvailableInterests] = useState([]);

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
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
    }, []);

    // --- Handlers for clearing messages ---
    const clearMessages = () => {
        setError('');
        setSuccess('');
        setPasswordError('');
    };

    // --- EVENT HANDLERS for Profile Editing ---
    const handleEditClick = (child) => {
        clearMessages();
        setEditingChildId(child.id);
        setEditFormData({
            ...child,
            interests: child.interests.map(interest => interest.name)
        });
    };

    const handleCancelClick = () => {
        setEditingChildId(null);
        setIsDropdownOpen(false);
    };

    const handleEditFormChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleEditInterestsChange = (interestName) => {
        const currentInterests = editFormData.interests || [];
        const newInterests = currentInterests.includes(interestName)
            ? currentInterests.filter((item) => item !== interestName)
            : [...currentInterests, interestName];
        setEditFormData({ ...editFormData, interests: newInterests });
    };

    const handleSaveClick = async () => {
        clearMessages();
        try {
            const childId = editFormData.id;
            const response = await api.patch(`/parent/update-child/${childId}`, editFormData);
            const updatedChildren = children.map((child) =>
                child.id === childId ? response.data : child
            );
            setChildren(updatedChildren);
            setEditingChildId(null);
            setIsDropdownOpen(false);
            setSuccess("Profile updated successfully!");
        } catch (err) {
            console.error("Failed to update child:", err);
            setError("Failed to save changes. Please try again.");
        }
    };

    // --- EVENT HANDLERS for Deleting Account ---
    const handleDeleteClick = (child) => {
        clearMessages();
        setChildToDelete(child);
    };

    const handleConfirmDelete = async () => {
        if (!childToDelete) return;
        try {
            await api.delete(`/parent/delete-child/${childToDelete.id}`);
            setChildren(children.filter(child => child.id !== childToDelete.id));
            setChildToDelete(null);
            setSuccess("Account deleted successfully.");
        } catch (err) {
            console.error("Failed to delete child account: ", err);
            setError("Failed to delete account. Please try again.");
            setChildToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setChildToDelete(null);
    };

    // --- EVENT HANDLERS for Changing Password ---
    const handlePasswordModalOpen = (child) => {
        clearMessages();
        setChildForPasswordChange(child);
    };

    const handlePasswordFormChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
        setPasswordError('');
    };
    
    const handleConfirmChangePassword = async () => {
        if (passwordData.new_password !== passwordData.confirm_new_password) {
            setPasswordError("New passwords do not match.");
            setPasswordData({ current_password: '', new_password: '', confirm_new_password: ''}); // clearn the form on error
            return;
        }
        if (!passwordData.current_password || !passwordData.new_password) {
            setPasswordError("All password fields are required.");
            return;
        }

        try {
            const childId = childForPasswordChange.id;
            const dataToSend = {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            };
            
            await api.patch(`/parent/change-kid-password/${childId}`, dataToSend);
            
            setSuccess(`Password for ${childForPasswordChange.first_name} ${childForPasswordChange.last_name} has been changed successfully!`);
            handleCancelChangePassword();
        } catch (err) {
            console.error("Failed to change password:", err);
            const detail = err.response?.data?.detail || "An unexpected error occurred. Please try again.";
            setPasswordError(detail);
            setPasswordData({ current_password: '', new_password: '', confirm_new_password: ''}); // clearn the form on error
        }
    };

    const handleCancelChangePassword = () => {
        setChildForPasswordChange(null);
        setPasswordData({ current_password: '', new_password: '', confirm_new_password: '' });
        setPasswordError('');
    };

    // --- RENDER LOGIC ---
    if (loading) return <div className="loading-state">Loading child accounts...</div>;

    return (
        <div className="page-container">
            <header className="page-header">
                <h2>View Child Accounts</h2>
            </header>
            
            {/* --- Global Success/Error Messages --- */}
            {error && <p className="form-message error">{error}</p>}
            {success && <p className="form-message success">{success}</p>}

            <main>
                {children.map((child) => (
                    <div key={child.id} className="child-account-card">
                        <h3>{editingChildId === child.id ? 'Editing Profile' : `${child.first_name} ${child.last_name}`}</h3>
                        
                        {editingChildId === child.id ? (
                            // --- EDITING VIEW ---
                            <div className="profile-details editing">
                                <div className="form-group"><label>Username</label><input type="text" name="username" value={editFormData.username} onChange={handleEditFormChange} /></div>
                                <div className="form-group"><label>First Name</label><input type="text" name="first_name" value={editFormData.first_name} onChange={handleEditFormChange} /></div>
                                <div className="form-group"><label>Last Name</label><input type="text" name="last_name" value={editFormData.last_name} onChange={handleEditFormChange} /></div>
                                <div className="form-group"><label>Birthday</label><input type="date" name="birthday" value={editFormData.birthday || ''} onChange={handleEditFormChange} /></div>
                                <div className="form-group"><label>Country</label><input type="text" name="country" value={editFormData.country || ''} onChange={handleEditFormChange} /></div>
                                <div className="form-group"><label>Gender</label><input type="text" name="gender" value={editFormData.gender || ''} onChange={handleEditFormChange} /></div>
                                <div className="form-group"><label>Race</label><input type="text" name="race" value={editFormData.race || ''} onChange={handleEditFormChange} /></div>
                                <div className="form-group full-width">
                                    <label>Interests</label>
                                    <div className="custom-dropdown">
                                        <button type="button" onClick={() => setIsDropdownOpen(prev => !prev)} className="dropdown-button">
                                            {(editFormData.interests || []).length} selected
                                            <span className="dropdown-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
                                        </button>
                                        {isDropdownOpen && (
                                            <div className="dropdown-panel">
                                                {availableInterests.map((interest) => (
                                                    <label key={interest.name} className="dropdown-item">
                                                        <input type="checkbox" checked={(editFormData.interests || []).includes(interest.name)} onChange={() => handleEditInterestsChange(interest.name)} />
                                                        {interest.name}
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // --- DISPLAY VIEW ---
                            <div className="profile-details">
                                <div className="form-group"><label>Username</label><input type="text" value={child.username} readOnly /></div>
                                <div className="form-group"><label>First Name</label><input type="text" value={child.first_name} readOnly /></div>
                                <div className="form-group"><label>Last Name</label><input type="text" value={child.last_name} readOnly /></div>
                                <div className="form-group"><label>Birthday</label><input type="text" value={child.birthday || 'N/A'} readOnly /></div>
                                <div className="form-group"><label>Country</label><input type="text" value={child.country || 'N/A'} readOnly /></div>
                                <div className="form-group"><label>Gender</label><input type="text" value={child.gender || 'N/A'} readOnly /></div>
                                <div className="form-group"><label>Race</label><input type="text" value={child.race || 'N/A'} readOnly /></div>
                                <div className="form-group full-width">
                                    <label>Interests</label>
                                    <div className="interests-display">
                                        {child.interests && child.interests.length > 0 ? child.interests.map(i => i.name).join(', ') : 'No interests specified'}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="action-buttons">
                            {editingChildId === child.id ? (
                                <>
                                    <button className="btn save-btn" onClick={handleSaveClick}>Save Changes</button>
                                    <button className="btn cancel-btn" onClick={handleCancelClick}>Cancel</button>
                                </>
                            ) : (
                                <>
                                    <button className="btn edit-btn" onClick={() => handleEditClick(child)}>Edit Profile</button>
                                    <button className="btn password-btn" onClick={() => handlePasswordModalOpen(child)}>Change Password</button>
                                    <button className="btn delete-btn" onClick={() => handleDeleteClick(child)}>Delete Account</button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </main>

            {/* --- MODAL for Deleting Account --- */}
            {childToDelete && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to permanently delete the account for <strong>{childToDelete.username}</strong>?</p>
                        <div className="modal-actions">
                            <button className="btn cancel-btn" onClick={handleCancelDelete}>Cancel</button>
                            <button className="btn delete-btn-confirm" onClick={handleConfirmDelete}>Delete Account</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* --- MODAL for Changing Password --- */}
            {childForPasswordChange && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Change Password</h3>
                        <p>Changing password for <strong>{childForPasswordChange.username}</strong>.</p>
                        
                        <form onSubmit={(e) => { e.preventDefault(); handleConfirmChangePassword(); }} className="modal-form">
                            <div className="form-group">
                                <label htmlFor="current_password">Current Password</label>
                                <input type="password" id="current_password" name="current_password" value={passwordData.current_password} onChange={handlePasswordFormChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="new_password">New Password</label>
                                <input type="password" id="new_password" name="new_password" value={passwordData.new_password} onChange={handlePasswordFormChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirm_new_password">Confirm New Password</label>
                                <input type="password" id="confirm_new_password" name="confirm_new_password" value={passwordData.confirm_new_password} onChange={handlePasswordFormChange} required />
                            </div>

                            {passwordError && <p className="form-message error">{passwordError}</p>}
                        
                            <div className="modal-actions">
                                <button type="button" className="btn cancel-btn" onClick={handleCancelChangePassword}>Cancel</button>
                                <button type="submit" className="btn save-btn">Save Password</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ViewChildAccounts;