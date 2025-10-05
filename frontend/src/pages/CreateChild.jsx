import React, { useState } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import '../styles/AuthForm.css'; // Use the same form styles

function CreateChild() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirm_password: '', // Required by the backend schema for validation
        first_name: '',
        last_name: '',
        country: '',
        gender: '',
        birthday: '', // YYYY-MM-DD
        race: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // 1. Frontend Password Validation
        if (formData.password !== formData.confirm_password) {
            return setError("Passwords do not match.");
        }
        
        // 2. Prepare Data and handle optional fields
        const dataToSend = { ...formData };
        
        // Convert empty strings to null for optional fields (Country, Gender, Birthday, Race)
        // NOTE: We MUST send 'confirm_password' because your backend requires it.
        const optionalFields = ['country', 'gender', 'race', 'birthday'];
        for (const key of optionalFields) {
            if (dataToSend[key] === "") {
                dataToSend[key] = null;
            }
        }

        try {
            // 3. POST request to the protected endpoint
            // The API instance automatically adds the parent's JWT token.
            const response = await api.post('/parent/create-child', dataToSend);

            setSuccess(`Child account '${dataToSend.username}' created successfully!`);
            
            // Clear form after success
            setFormData({
                username: '', email: '', password: '', confirm_password: '',
                first_name: '', last_name: '', country: '', gender: '',
                birthday: '', race: '',
            });

        } catch (err) {
            console.error("Child Creation Error Response:", err.response); 
            
            const defaultDetail = 'Account creation failed. Check input values.';
            let detail = defaultDetail;

            if (err.response && err.response.data && err.response.data.detail) {
                const errorDetails = err.response.data.detail;
                if (Array.isArray(errorDetails)) {
                    // Display specific Pydantic validation errors
                    detail = "Validation Failed: " + errorDetails.map(e => {
                        const field = e.loc[e.loc.length - 1]; 
                        return `${field} (${e.msg})`;
                    }).join('; ');
                } else {
                    detail = errorDetails; // General FastAPI error message
                }
            } else if (err.message) {
                detail = `Network Error: ${err.message}`;
            }

            setError(detail);
        }
    };
    
    return (
        <div className="main-content-card">
            <h2>Create Child Account</h2>
            <p>Use this form to register a new user account and link them to your parent profile.</p>

            {/* Added 'register' class for the two-column grid layout */}
            <form onSubmit={handleSubmit} className="auth-form register">
                
                {/* Error/Success Messages spanning full width */}
                {error && <p className="form-message error">{error}</p>}
                {success && <p className="form-message success">{success}</p>}

                {/* --- Credentials (Column 1) --- */}
                <div className="form-group">
                    <label htmlFor="username">Username (Child)</label>
                    <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required />
                </div>

                {/* Email is typically NOT required for child accounts, so it's omitted here */}
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
                </div>

                <div className="form-group">
                    <label htmlFor="confirm_password">Confirm Password</label>
                    <input type="password" id="confirm_password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} required />
                </div>
                
                {/* --- Personal Details (Column 2) --- */}
                <div className="form-group">
                    <label htmlFor="first_name">First Name</label>
                    <input type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required />
                </div>

                <div className="form-group">
                    <label htmlFor="last_name">Last Name</label>
                    <input type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required />
                </div>
                
                <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <input type="text" id="country" name="country" value={formData.country} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label htmlFor="gender">Gender</label>
                    <input type="text" id="gender" name="gender" value={formData.gender} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label htmlFor="birthday">Birthday (YYYY-MM-DD)</label>
                    <input type="date" id="birthday" name="birthday" value={formData.birthday} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label htmlFor="race">Race</label>
                    <input type="text" id="race" name="race" value={formData.race} onChange={handleChange} />
                </div>

                {/* Button spans full width */}
                <button type="submit">Create Account</button>
            </form>
        </div>
    );
}

export default CreateChild;
