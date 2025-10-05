import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/ParentProfile.css'; // Corrected CSS import

// Renamed component from MyProfile to ParentProfile
function ParentProfile() {
    // 1. Load initial data from localStorage (set during login)
    const initialProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');

    // State for the data being edited
    const [profileData, setProfileData] = useState(initialProfile);
    // State to toggle between view and edit modes
    const [isEditing, setIsEditing] = useState(false);
    // State for feedback messages
    const [message, setMessage] = useState('');
    
    // Fields that are mandatory for the Parent role in the edit form
    const requiredForParent = ['first_name', 'last_name', 'country', 'gender', 'birthday', 'race'];
    
    // --- Data Loading and Hydration ---
    useEffect(() => {
        // If the profile data is missing a key identifier, re-fetch it
        if (!profileData.username) {
            fetchLatestProfile();
        }
    }, [profileData.username]); // Dependency added for safety

    const fetchLatestProfile = async () => {
        try {
            const response = await api.get('/users/me/');
            const latestProfile = response.data;
            setProfileData(latestProfile);
            localStorage.setItem('userProfile', JSON.stringify(latestProfile));
        } catch (error) {
            setMessage('Failed to load profile data.');
            console.error("Profile fetch error:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    // --- Submission Handler ---
    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('');

        // Prepare data to send (only include fields that can be updated)
        const dataToSend = {};
        
        // Fields that cannot be changed via the profile form (handled elsewhere or immutable)
        const excludedFields = ['id', 'username', 'email', 'role', 'tier', 'hashed_password', 'primary_parent_id', 'children_list', 'parent_user'];

        // 1. Client-Side Check for required fields (since asterisks are removed)
        const missingFields = requiredForParent.filter(key => !profileData[key] || profileData[key].toString().trim() === '');
        
        if (missingFields.length > 0) {
            setMessage(`Error: The following fields are required: ${missingFields.join(', ')}.`);
            return;
        }

        // 2. Filter data to send only necessary, allowed fields
        for (const key in profileData) {
            if (excludedFields.includes(key)) {
                continue;
            }
            
            let value = profileData[key];
            
            // Convert empty string/null value to explicit null for FastAPI
            if (!value || value.toString().trim() === '') {
                value = null; 
            }
            
            dataToSend[key] = value;
        }

        try {
            // 3. PATCH request to update the user profile
            const response = await api.patch('/users/me/', dataToSend);
            const updatedProfile = response.data;

            // 4. Update local state and storage
            setProfileData(updatedProfile);
            localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
            
            setIsEditing(false);
            setMessage('Profile successfully updated!');

        } catch (err) {
            // Check for 422 errors and attempt to display server validation details
            let detail = err.response?.data?.detail || 'Update failed.';
            
            if (Array.isArray(err.response?.data?.detail)) {
                detail = "Server Validation Error: " + err.response.data.detail.map(e => `${e.loc[e.loc.length - 1]} (${e.msg})`).join('; ');
            }
            
            setMessage(`Error: ${detail}`);
            console.error("Update error:", err.response || err);
        }
    };
    
    // Helper function to render data fields
    const renderField = (label, key) => {
        // Check if the field is required for the Parent role (for validation, not display)
        const isRequired = requiredForParent.includes(key);
        
        // Use 'N/A' for null/empty values in view mode
        const value = profileData[key] || ''; 
        const inputType = key === 'birthday' ? 'date' : 'text';
        
        return (
            <div className="profile-field" key={key}>
                {/* Asterisk removed from label display */}
                <label>{label}:</label> 
                {isEditing ? (
                    <input
                        type={inputType}
                        name={key}
                        value={value}
                        onChange={handleChange}
                        // Validation is still enforced here:
                        required={isRequired} 
                        placeholder={value === '' && !isRequired ? `Not provided` : undefined}
                    />
                ) : (
                    <span className="profile-value">{value || 'Not provided'}</span>
                )}
            </div>
        );
    };


    return (
        <div className="profile-view">
            <h3>My Profile Details</h3>
            
            {message && <p className={`message ${message.startsWith('Error') ? 'error' : 'success'}`}>{message}</p>}

            <div className="profile-actions">
                {isEditing ? (
                    // Button for saving the form (no type="submit" reliance)
                    <button onClick={handleUpdate} className="btn-primary">Save Profile</button>
                ) : (
                    // Button for toggling edit mode (type="button" to prevent accidental submit)
                    <button onClick={() => setIsEditing(true)} className="btn-primary" type="button">Edit Profile</button>
                )}
            </div>

            {/* Form is no longer needed for submission, but retains structure */}
            <form id="profile-form" onSubmit={isEditing ? handleUpdate : (e) => e.preventDefault()} className="profile-grid">
                {/* Immutable Fields */}
                {renderField('Username', 'username')}
                {renderField('Email', 'email')}
                
                {/* Editable Fields (All required for Parent role) */}
                {renderField('First Name', 'first_name')}
                {renderField('Last Name', 'last_name')}
                {renderField('Country', 'country')}
                {renderField('Gender', 'gender')}
                {renderField('Birthday', 'birthday')}
                {renderField('Race', 'race')}
            </form>
            
            {/* Subscription Tier (Read-Only) - Moved to the bottom */}
            <div className="profile-field tier-status">
                <label>Subscription Tier:</label>
                <span className="profile-value tier">{profileData.tier || 'FREE'}</span>
                {/* Hide upgrade button when editing */}
                {isEditing ? (
                    null
                ) : (
                    <button type="button" className="btn-secondary">Upgrade</button>
                )}
            </div>

            {/* Single note for required fields */}
            {isEditing && (
                <p className="edit-note">All fields must be filled.</p>
            )}
        </div>
    );
}

export default ParentProfile;