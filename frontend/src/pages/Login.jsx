import React, { useState } from 'react';
import api from '../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Login.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const formBody = new URLSearchParams();
        formBody.append('username', username);
        formBody.append('password', password);

        try {
            // 1. Make a SINGLE API call to get both the token and the profile
            const response = await api.post('/auth/token', formBody, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded' 
                }
            });

            // 2. Destructure the combined data from the single response
            const { access_token, user_role, profile } = response.data;
            
            // 3. Store all necessary data in localStorage
            localStorage.setItem('accessToken', access_token);
            localStorage.setItem('userRole', user_role);
            localStorage.setItem('userProfile', JSON.stringify(profile));
            
            // 4. Redirect based on the user's role
            switch (user_role) {
                case 'PARENT':
                    navigate('/parent-dashboard');
                    break;
                case 'CHILD':
                    navigate('/child-dashboard');
                    break;
                case 'ADMIN':
                    navigate('/admin-dashboard');
                    break;
                case 'LIBRARIAN':
                    navigate('/librarian-dashboard');
                    break;
                default:
                    navigate('/'); // Fallback to landing page
                    break;
            }

        } catch (err) {
            const detail = err.response?.data?.detail || 'Incorrect username or password.';
            setError(detail);
        }
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form">
                <Link to="/LandingPage" className="btn-back-landing">&larr; Landing Page</Link>
                <h2>Log In</h2>
                
                {error && <p className="form-message error">{error}</p>}

                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input 
                        type="text" 
                        id="username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        required 
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input 
                        type="password" 
                        id="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                </div>
                
                <button type="submit">Log In</button>

                <p className="link-text">
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
                 <p className="link-text secondary-link">
                    Want to help us curate books and videos? <Link to="/librarianregister">Register here</Link>
                </p>
            </form>
        </div>
    );
}

export default Login;