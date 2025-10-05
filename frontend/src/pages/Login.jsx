import React, { useState } from 'react';
import api from '../api/axiosConfig'; // Use the custom API instance
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import '../styles/AuthForm.css'; // Import the CSS styles

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchUserProfile = async (token, role) => {
        try {
            // This GET request uses the interceptor to attach the token
            const profileResponse = await api.get('/users/me/');

            // Store full profile data in global state/storage
            const userProfile = profileResponse.data;
            localStorage.setItem('userProfile', JSON.stringify(userProfile));

            // Redirect based on the role retrieved during login
            if (role === 'PARENT') {
                navigate('/parent-dashboard');
            } else if (role === 'CHILD') {
                navigate('/child-dashboard');
            } else {
                navigate('/');
            }

        } catch (err) {
            console.error("Failed to fetch user profile:", err);
            setError("Login successful, but failed to load profile.");
            // Clear token if the profile fetch fails (security measure)
            localStorage.removeItem('accessToken'); 
            localStorage.removeItem('tokenType');
            localStorage.removeItem('userRole');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Prepare data in x-www-form-urlencoded format for FastAPI OAuth
        const formBody = new URLSearchParams();
        formBody.append('username', username);
        formBody.append('password', password);

        try {
            // 1. Call /auth/token to get JWT
            const tokenResponse = await api.post('/auth/token', formBody, {
                headers: {
                    // CRITICAL: Must be x-www-form-urlencoded for OAuth
                    'Content-Type': 'application/x-www-form-urlencoded' 
                }
            });

            const { access_token, token_type, user_role } = tokenResponse.data;
            
            // 2. Store minimal token info
            localStorage.setItem('accessToken', access_token);
            localStorage.setItem('tokenType', token_type);
            localStorage.setItem('userRole', user_role); // Store role for immediate routing
            
            // 3. Fetch full profile immediately
            await fetchUserProfile(access_token, user_role);

        } catch (err) {
            const detail = err.response?.data?.detail || 'Login failed.';
            const displayDetail = typeof detail === 'string' ? detail : 'Incorrect username or password.';
            setError(displayDetail);
        }
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form">
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
            </form>
        </div>
    );
}

export default Login;