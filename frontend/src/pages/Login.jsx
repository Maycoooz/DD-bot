// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import api from '../api/axiosConfig'; // Use the custom API instance
import { useNavigate } from 'react-router-dom';

function Login({ setGlobalUser }) { // Assume setGlobalUser function comes from App
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
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Prepare data in x-www-form-urlencoded format
        const formBody = new URLSearchParams();
        formBody.append('username', username);
        formBody.append('password', password);

        try {
            // 1. Call /token to get JWT
            const tokenResponse = await api.post('/auth/token', formBody, {
                headers: {
                    // Manually override the header for this specific call (FastAPI OAuth requirement)
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
            setError(detail);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Log In</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Log In</button>
        </form>
    );
}

export default Login;