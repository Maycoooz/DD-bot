import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';
import '../styles/AdminEditLandingPageReviews.css'; 

function AdminEditLandingPageReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Function to fetch the 6 (or fewer) reviews currently on the landing page
    const fetchLandingPageReviews = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('reviews/app/latest');
            setReviews(response.data || []);
        } catch (err) {
            console.error("Error fetching reviews:", err);
            setError('Failed to load landing page reviews. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch reviews when the component mounts
    useEffect(() => {
        fetchLandingPageReviews();
    }, [fetchLandingPageReviews]);

    // Function to handle revoking a review's approval
    const handleRevoke = async (reviewId) => {
        // Clear previous messages
        setError('');
        setSuccess('');

        try {
            const response = await api.put(`/admin/review/${reviewId}/revoke-approval`);
            setSuccess(response.data.message || 'Review approval revoked!');
            
            // Crucial: Refetch the list to show the new set of reviews
            // The revoked review will be gone, and a new one will take its place
            await fetchLandingPageReviews();

        } catch (err) {
            console.error("Error revoking review:", err);
            const errorMsg = err.response?.data?.detail || 'Failed to revoke review.';
            setError(errorMsg);
        }
    };

    // Helper to render star ratings
    const renderStars = (starCount) => {
        return "★".repeat(starCount);
    };

    return (
        <div className="admin-reviews-container">
            <h2>Manage Landing Page Reviews</h2>
            <p className="admin-reviews-subtitle">
                These are the latest 5-star reviews shown on the landing page. 
                Revoking approval will remove a review and replace it with the next available one.
            </p>

            {/* --- Status Messages --- */}
            {loading && <div className="admin-loading-state">Loading reviews...</div>}
            {error && <div className="admin-error-message">{error}</div>}
            {success && <div className="admin-success-message">{success}</div>}

            {/* --- Reviews List/Grid --- */}
            <div className="admin-reviews-grid">
                {!loading && reviews.length === 0 && (
                    <div className="admin-no-reviews-message">
                        No approved 5-star app reviews are currently available to display.
                    </div>
                )}

                {reviews.map((review) => (
                    <div key={review.id} className="admin-review-card">
                        <div className="review-card-header">
                            <span className="review-user-name">
                                {review.user ? review.user.username : 'Anonymous'}
                            </span>
                            <span className="review-stars">
                                {renderStars(review.stars)}
                            </span>
                        </div>
                        <p className="review-text">"{review.review}"</p>
                        <button 
                            className="btn-revoke"
                            onClick={() => handleRevoke(review.id)}
                        >
                            Revoke Approval
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AdminEditLandingPageReviews;