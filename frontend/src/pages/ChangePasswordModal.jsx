import React, { useState } from 'react';
import api from '../api/axiosConfig';
import '../styles/ChangePasswordModal.css';

// Accept the new 'username' prop
function ChangePasswordModal({ userId, username, onClose }) { 
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }

        const passwordData = {
            current_password: currentPassword,
            new_password: newPassword,
        };

        try {
            const response = await api.patch(`/users/change-password/${userId}`, passwordData);
            setSuccess(response.data.message || 'Password updated successfully!');
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            const detail = err.response?.data?.detail || 'An unexpected error occurred.';
            setError(detail);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                
                {/* --- NEW HEADER SECTION --- */}
                <div className="modal-header">
                    <h2>Change Password</h2>
                    <p>Changing password for <strong>{username}</strong>.</p>
                </div>

                {error && <p className="message error">{error}</p>}
                {success && <p className="message success">{success}</p>}
                
                <form onSubmit={handleSubmit} className="password-form">
                    <div className="form-field">
                        <label htmlFor="current_password">Current Password</label>
                        <input
                            id="current_password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-field">
                        <label htmlFor="new_password">New Password</label>
                        <input
                            id="new_password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-field">
                        <label htmlFor="confirm_password">Confirm New Password</label>
                        <input
                            id="confirm_password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    {/* --- UPDATED BUTTONS SECTION --- */}
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-save">Save Password</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ChangePasswordModal;