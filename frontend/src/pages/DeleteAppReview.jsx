import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/DeleteAppReview.css';
import ConfirmationModal from './ConfirmationModal';

function DeleteAppReview() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [reviewToDelete, setReviewToDelete] = useState(null);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await api.get('/reviews/my-reviews');
                setReviews(response.data);
            } catch (err) {
                setError('Failed to load your reviews.');
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);

    const handleDeleteClick = (review) => {
        setReviewToDelete(review);
    };

    const handleConfirmDelete = async () => {
        if (!reviewToDelete) return;
        try {
            const response = await api.delete(`/reviews/${reviewToDelete.id}`);
            setReviews(prev => prev.filter(r => r.id !== reviewToDelete.id));
            setSuccess(response.data.message);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete review.');
        } finally {
            setReviewToDelete(null);
        }
    };

    if (loading) return <div>Loading your reviews...</div>;

    return (
        <div className="delete-review-container">
            <h2>Your Past Reviews</h2>
            {error && <p className="message error">{error}</p>}
            {success && <p className="message success">{success}</p>}
            
            <div className="reviews-list">
                {reviews.length === 0 ? (
                    <p>You have not submitted any reviews yet.</p>
                ) : (
                    reviews.map(review => (
                        <div key={review.id} className="review-item">
                            <div className="review-content">
                                <div className="review-stars">
                                    {'★'.repeat(review.stars)}{'☆'.repeat(5 - review.stars)}
                                </div>
                                <p className="review-text">{review.review}</p>
                                <span className="review-meta">
                                    Reviewed on: {new Date(review.created_at).toLocaleString()}
                                </span>
                            </div>
                            <button onClick={() => handleDeleteClick(review)} className="btn-delete">
                                Delete
                            </button>
                        </div>
                    ))
                )}
            </div>

            {reviewToDelete && (
                <ConfirmationModal
                    message="Are you sure you want to permanently delete this review?"
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setReviewToDelete(null)}
                />
            )}
        </div>
    );
}

export default DeleteAppReview;