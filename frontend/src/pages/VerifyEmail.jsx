// src/pages/VerifyEmailPage.jsx

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig'; // Your configured Axios instance

function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const [message, setMessage] = useState('Verifying your email, please wait...');
    const [error, setError] = useState(false);

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setMessage('Verification token not found.');
            setError(true);
            return;
        }

        const verifyToken = async () => {
            try {
                // This is the API call to your backend
                const response = await api.get(`/auth/verify?token=${token}`);
                setMessage(response.data.message || 'Email verified successfully! You can now log in.');
                setError(false);
            } catch (err) {
                const errorMessage = err.response?.data?.detail || 'Verification failed. The link may be expired or invalid.';
                setMessage(errorMessage);
                setError(true);
            }
        };

        verifyToken();
    }, [searchParams]); // Effect runs when the component mounts

    return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <h1>Email Verification</h1>
            <p style={{ color: error ? 'red' : 'green' }}>
                {message}
            </p>
            {/* You can add a link to your login page here */}
        </div>
    );
}

export default VerifyEmailPage;