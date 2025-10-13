import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const [message, setMessage] = useState('Verifying your email, please wait...');
    const [isSuccess, setIsSuccess] = useState(false); // State to track success of email confirmationn
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
                const response = await api.get(`/auth/verify?token=${token}`);
                setMessage(response.data.message || 'Email verified successfully!');
                setIsSuccess(true); // Set success to true
                setError(false);
            } catch (err) {
                const errorMessage = err.response?.data?.detail || 'Verification failed. The link may be expired or invalid.';
                setMessage(errorMessage);
                setError(true);
            }
        };

        verifyToken();
    }, [searchParams]);

    return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <h1>Email Verification</h1>
            <p style={{ color: error ? 'red' : 'green', marginBottom: '20px' }}>
                {message}
            </p>
            
            {/* This link will only appear on a successful verification */}
            {isSuccess && (
                <Link to="/login" style={{ textDecoration: 'none', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', borderRadius: '5px' }}>
                    Go to Login Page
                </Link>
            )}
        </div>
    );
}

export default VerifyEmailPage;