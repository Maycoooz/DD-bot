import React, { useState } from 'react';
import api from '../api/axiosConfig'; // Use the custom API instance
import { useNavigate, Link } from 'react-router-dom'; 
import '../styles/Register.css';

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirm_password: '',
        first_name: '',
        last_name: '',
        country: '',
        gender: '',
        // Note: For birthday, you'll typically use a string 'YYYY-MM-DD'
        birthday: '', 
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
        setError(''); // Clear error on input change
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // 1. Frontend Password Validation
        if (formData.password !== formData.confirm_password) {
            return setError("Passwords do not match.");
        }
        
        // 2. Prepare Data
        // Clone formData and remove confirm_password before sending
        const dataToSend = { ...formData };
        delete dataToSend.confirm_password; 

        const optionalFields = ['country', 'gender', 'race', 'birthday'];
        for (const key of optionalFields) {
            // Check for the optional fields and ensure the value is not an empty string
            if (dataToSend[key] === "") {
                dataToSend[key] = null;
            }
        }

        try {
            // 3. POST request to the registration endpoint
            const response = await api.post('/auth/register', dataToSend);

            setSuccess(response.data.message);

        } catch (err) {
             console.error("Registration Error Response:", err.response); 
            
            const defaultDetail = 'Registration failed. Check your input values.';
            let detail = defaultDetail;

            if (err.response && err.response.data && err.response.data.detail) {
                const errorDetails = err.response.data.detail;
                if (Array.isArray(errorDetails)) {
                    // Safely map Pydantic errors to a single string
                    detail = "Validation Failed: " + errorDetails.map(e => {
                        // Display the failing field and the message
                        const field = e.loc[e.loc.length - 1]; 
                        return `${field} (${e.msg})`;
                    }).join('; ');
                } else {
                    // Catch cases where 'detail' is a simple string error
                    detail = errorDetails;
                }
            } else if (err.message) {
                // Catch network errors
                detail = `Network Error: ${err.message}`;
            }

            setError(detail); // Ensure error state is set to a string
        }
    };
    
    return (
        <div className="auth-container">
            {/* Added 'register' class for two-column grid layout */}
            <form onSubmit={handleSubmit} className="auth-form register">
                <h2>Register New Parent Account</h2>
                
                {/* Error/Success Messages spanning full width */}
                {error && <p className="form-message error">{error}</p>}
                {success && <p className="form-message success">{success}</p>}

                {/* --- Credentials (Column 1) --- */}
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>

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
                    <label>Gender</label>
                    <div className="gender-radio-group">
                        <label className={`radio-button ${formData.gender === 'Male' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="gender"
                                value="Male"
                                checked={formData.gender === 'Male'}
                                onChange={handleChange}
                            />
                            Male
                        </label>
                        <label className={`radio-button ${formData.gender === 'Female' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="gender"
                                value="Female"
                                checked={formData.gender === 'Female'}
                                onChange={handleChange}
                            />
                            Female
                        </label>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="birthday">Birthday (YYYY-MM-DD)</label>
                    {/* Using type="date" ensures YYYY-MM-DD format */}
                    <input type="date" id="birthday" name="birthday" value={formData.birthday} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label htmlFor="race">Race</label>
                    <input type="text" id="race" name="race" value={formData.race} onChange={handleChange} />
                </div>

                {/* Button and Link span full width */}
                <button type="submit">Register</button>
                
                <p className="link-text">
                    Already have an account? <Link to="/login">Log in here</Link>
                </p>
            </form>
        </div>
    );
}

export default Register;
