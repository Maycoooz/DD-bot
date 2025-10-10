import React, { useState } from 'react';
import api from '../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/LibrarianRegister.css'; // Using the two-column register styles

function RegisterLibrarian() {
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
        birthday: '', 
        race: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirm_password) {
            return setError("Passwords do not match.");
        }
        
        const dataToSend = { ...formData };
        delete dataToSend.confirm_password; 

        try {
            const response = await api.post('/auth/register-librarian', dataToSend);
            setSuccess(response.data.message);
        } catch (err) {
            let detail = 'Registration failed. Please try again.';
            if (err.response && err.response.data && err.response.data.detail) {
                const errorDetails = err.response.data.detail;
                if (Array.isArray(errorDetails)) {
                    detail = errorDetails.map(e => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join('; ');
                } else {
                    detail = errorDetails;
                }
            }
            setError(detail);
        }
    };
    
    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form register">
                <h2>Register as a Librarian</h2>
                
                {error && <p className="form-message error">{error}</p>}
                {success && <p className="form-message success">{success}</p>}

                {/* --- Fields in the new specified order --- */}
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Librarian Email</label>
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
                    <input type="text" id="country" name="country" value={formData.country} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Gender</label>
                    <div className="gender-radio-group">
                        <label className={`radio-button ${formData.gender === 'Male' ? 'selected' : ''}`}>
                            <input type="radio" name="gender" value="Male" checked={formData.gender === 'Male'} onChange={handleChange} />
                            Male
                        </label>
                        <label className={`radio-button ${formData.gender === 'Female' ? 'selected' : ''}`}>
                            <input type="radio" name="gender" value="Female" checked={formData.gender === 'Female'} onChange={handleChange} />
                            Female
                        </label>
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="birthday">Birthday</label>
                    <input type="date" id="birthday" name="birthday" value={formData.birthday} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="race">Race</label>
                    <input type="text" id="race" name="race" value={formData.race} onChange={handleChange} required />
                </div>

                {/* --- Full Width --- */}
                <button type="submit">Register</button>
                <p className="link-text">
                    Already have an account? <Link to="/login">Log in here</Link>
                </p>
            </form>
        </div>
    );
}

export default RegisterLibrarian;