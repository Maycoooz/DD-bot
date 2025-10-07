import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/ParentProfile.css';
import ChangePasswordModal from './ChangePasswordModal';

function ParentProfile({ onProfileUpdate }) {
    // --- STATES ---
    const initialProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const [profileData, setProfileData] = useState(initialProfile);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    
    // Fields that are mandatory for the Parent role
    const requiredForParent = ['first_name', 'last_name', 'country', 'gender', 'birthday', 'race'];
    
    // --- HANDLERS & EFFECTS ---

    // Effect to fetch complete data if the ID is missing
    useEffect(() => {
        if (!profileData.id) {
            fetchLatestProfile();
        }
    }, [profileData.id]);

    // Fetches the latest user profile data from the server
    const fetchLatestProfile = async () => {
        console.log("Attempting to fetch latest profile...");
        try {
            const response = await api.get('/users/me/');
            const latestProfile = response.data;
            setProfileData(latestProfile);
            localStorage.setItem('userProfile', JSON.stringify(latestProfile));
        } catch (error) {
            setMessage('Failed to load profile data.');
        }
    };

    // Handles changes in form input fields
    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    // Handles the submission of the profile update form
    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('');

        const dataToSend = {};
        const excludedFields = ['id', 'username', 'email', 'role', 'tier', 'hashed_password', 'primary_parent_id', 'children_list', 'parent_user'];
        const missingFields = requiredForParent.filter(key => !profileData[key] || profileData[key].toString().trim() === '');
        
        if (missingFields.length > 0) {
            setMessage(`Error: The following fields are required: ${missingFields.join(', ')}.`);
            return;
        }

        for (const key in profileData) {
            if (excludedFields.includes(key)) continue;
            let value = profileData[key];
            if (!value || value.toString().trim() === '') {
                value = null; 
            }
            dataToSend[key] = value;
        }

        try {
            const response = await api.patch('/users/me/', dataToSend);
            const updatedProfile = response.data;

            setProfileData(updatedProfile);
            localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
            
            setIsEditing(false);
            setMessage('Profile successfully updated!');

            if (onProfileUpdate) {
                onProfileUpdate(updatedProfile);
            }

        } catch (err) {
            let detail = err.response?.data?.detail || 'Update failed.';
            if (Array.isArray(err.response?.data?.detail)) {
                detail = "Server Validation Error: " + err.response.data.detail.map(e => `${e.loc[e.loc.length - 1]} (${e.msg})`).join('; ');
            }
            setMessage(`Error: ${detail}`);
            console.error("Update error:", err.response || err);
        }
    };
    
    // Renders a single profile field (in either view or edit mode)
    const renderField = (label, key) => {
        const isRequired = requiredForParent.includes(key);
        const value = profileData[key] || ''; 
        const inputType = key === 'birthday' ? 'date' : 'text';
        
        return (
            <div className="profile-field" key={key}>
                <label>{label}:</label> 
                {isEditing ? (
                    <input
                        type={inputType}
                        name={key}
                        value={value}
                        onChange={handleChange}
                        required={isRequired} 
                        placeholder={value === '' && !isRequired ? `Not provided` : undefined}
                    />
                ) : (
                    <span className="profile-value">{value || 'Not provided'}</span>
                )}
            </div>
        );
    };

    // --- JSX RENDER ---
    return (
        <div className="profile-view">
            <h3>My Profile Details</h3>
            
            {message && <p className={`message ${message.startsWith('Error') ? 'error' : 'success'}`}>{message}</p>}

            <div className="profile-actions">
                {isEditing ? (
                    <button onClick={handleUpdate} className="btn-primary">Save Profile</button>
                ) : (
                    <>
                        <button onClick={() => setIsEditing(true)} className="btn-primary" type="button">Edit Profile</button>
                        <button 
                            onClick={() => {
                                setShowPasswordModal(true);
                            }} 
                            className="btn-secondary" 
                            type="button"
                        >
                            Change Password
                        </button>
                    </>
                )}
            </div>

            <form id="profile-form" onSubmit={isEditing ? handleUpdate : (e) => e.preventDefault()} className="profile-grid">
                {renderField('Username', 'username')}
                {renderField('Email', 'email')}
                {renderField('First Name', 'first_name')}
                {renderField('Last Name', 'last_name')}
                {renderField('Country', 'country')}
                {renderField('Gender', 'gender')}
                {renderField('Birthday', 'birthday')}
                {renderField('Race', 'race')}
            </form>
            
            <div className="profile-field tier-status">
                <label>Subscription Tier:</label>
                <span className="profile-value tier">{profileData.tier || 'FREE'}</span>
                {!isEditing && (
                    <button type="button" className="btn-upgrade">
                        {profileData.tier === 'PRO' ? 'Switch to Free' : 'Upgrade to Pro'}
                    </button>
                )}
            </div>

            {isEditing && (
                <p className="edit-note">All fields must be filled.</p>
            )}

            {showPasswordModal && profileData.id && (
                <ChangePasswordModal 
                    userId={profileData.id}
                    username={profileData.username}
                    onClose={() => setShowPasswordModal(false)}
                />
            )}
        </div>
    );
}

export default ParentProfile;