import React, { useState } from 'react';
import api from '../api/axiosConfig';
import '../styles/AddAppReview.css';

const StarRating = ({ rating, setRating }) => {
    return (
        <div className="star-rating">
            {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <span
                        key={starValue}
                        className={starValue <= rating ? 'star filled' : 'star'}
                        onClick={() => setRating(starValue)}
                    >
                        &#9733;
                    </span>
                );
            })}
        </div>
    );
};

function AddAppReview() {
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a star rating.');
            return;
        }
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        try {
            const payload = { stars: rating, review: reviewText };
            const response = await api.post('/reviews/app', payload);
            setSuccess(response.data.message);
            setRating(0);
            setReviewText('');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to submit review.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="add-review-container">
            <h2>Leave a Review for Our App</h2>
            <form onSubmit={handleSubmit} className="review-form">
                {error && <p className="message error">{error}</p>}
                {success && <p className="message success">{success}</p>}

                <div className="form-group">
                    <label>Your Rating</label>
                    <StarRating rating={rating} setRating={setRating} />
                </div>
                <div className="form-group">
                    <label htmlFor="reviewText">Your Review (Optional)</label>
                    <textarea
                        id="reviewText"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Tell us what you think..."
                    />
                </div>
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
            </form>
        </div>
    );
}

export default AddAppReview;