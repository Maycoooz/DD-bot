// frontend/src/pages/Register.jsx
import React, { useState } from 'react';
import api from '../api/axiosConfig'; // Use the custom API instance
import { data, useNavigate } from 'react-router-dom';

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
        // Your FastAPI endpoint expects a JSON body (unlike the /token endpoint)
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

            setSuccess('Registration successful! Redirecting to login...');
            
            // 4. Redirect to login after a short delay
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
             console.error("Registration Error Response:", err.response); 
            
            const defaultDetail = 'Registration failed. Check your input values.';
            let detail = defaultDetail;

            if (err.response && err.response.data && err.response.data.detail) {
                const errorDetails = err.response.data.detail;
                if (Array.isArray(errorDetails)) {
                    // 💥 FIX: Safely map Pydantic errors to a single string
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
        <form onSubmit={handleSubmit} style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
            <h2>Register New Parent Account</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}

            {/* --- User Credentials --- */}
            <label>Username:</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required />

            <label>Email:</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />

            <label>Password:</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />

            <label>Confirm Password:</label>
            <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} required />

            {/* --- Personal Details --- */}
            <label>First Name:</label>
            <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required />

            <label>Last Name:</label>
            <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required />

            <label>Country:</label>
            <input type="text" name="country" value={formData.country} onChange={handleChange} />
            
            <label>Gender:</label>
            <input type="text" name="gender" value={formData.gender} onChange={handleChange} />

            <label>Birthday (YYYY-MM-DD):</label>
            <input type="date" name="birthday" value={formData.birthday} onChange={handleChange} />

            <label>Race:</label>
            <input type="text" name="race" value={formData.race} onChange={handleChange} />

            <button type="submit">Register</button>
        </form>
    );
}

export default Register;