import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';
import '../styles/AdminViewAllReviews.css'; 

function AdminViewAllReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // State for pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0); 
    
    // State for filters
    const [filterStars, setFilterStars] = useState(''); // '' set filter to all by default
    const [filterType, setFilterType] = useState(''); 

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = {
                page: currentPage,
                size: 10,
                stars: filterStars || null, // Send null if filter is empty
                review_type: filterType || null, // Send null if filter is empty
            };
            
            const response = await api.get('/admin/all-reviews', { params });
            
            setReviews(response.data.items || []);
            setTotalReviews(response.data.total); 
            setTotalPages(Math.ceil(response.data.total / params.size));
            
        } catch (err) {
            console.error("Error fetching reviews:", err);
            setError('Failed to load reviews. Please try again.');
            setTotalReviews(0); // reset total review to 0 on error
        } finally {
            setLoading(false);
        }
    }, [currentPage, filterStars, filterType]);

    // Fetch reviews when component mounts or dependencies change
    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterStars, filterType]);

    return (
        <div className="admin-view-all-container">
            {/* --- Header --- */}
            <div className="admin-reviews-header">
                <h2>Manage All Reviews</h2>
            </div>

            {/* --- Filter Controls --- */}
            <div className="admin-filters">
                <div className="filter-controls-wrapper">
                    <div className="filter-group">
                        <label htmlFor="star-filter">Filter by Stars</label>
                        <select 
                            id="star-filter"
                            value={filterStars}
                            onChange={(e) => setFilterStars(e.target.value)}
                        >
                            <option value="">All Star Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label htmlFor="type-filter">Filter by Type</label>
                        <select
                            id="type-filter"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="APP">App</option>
                            <option value="BOOK">Book</option>
                            <option value="VIDEO">Video</option>
                        </select>
                    </div>
                </div>

                {/*  Badge for total reviews stat inside filter controls div */}
                {!loading && !error && totalReviews > 0 && (
                    <span className="total-reviews-badge">
                        {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'} Found
                    </span>
                )}
            </div>

            {/* --- Status Messages --- */}
            {loading && <div className="admin-loading-state">Loading reviews...</div>}
            {error && <div className="admin-error-message">{error}</div>}

            {/* --- Reviews Table --- */}
            {!loading && !error && (
                <>
                    <div className="admin-table-container">
                        <table className="admin-reviews-table">
                            <thead>
                                <tr>
                                    <th>Reviewer</th>
                                    <th>User Email</th>
                                    <th>Parent Email</th>
                                    <th>Review</th>
                                    <th>Stars</th>
                                    <th>Type</th>
                                    <th>Publicly Approved</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.length > 0 ? (
                                    reviews.map((review) => (
                                        <tr key={review.id}>
                                            <td>
                                                <strong>{review.user.username}</strong>
                                                <span className="user-role-badge">{review.user.role_name}</span>
                                            </td>
                                            <td>{review.user.email}</td>
                                            <td>{review.user.parent_email || 'N/A'}</td>
                                            <td className="review-text-cell" title={review.review}>
                                                {review.review}
                                            </td>
                                            <td>{'★'.repeat(review.stars)}</td>
                                            <td>{review.review_type}</td>
                                            <td>{review.is_public_display_approved ? 'Yes' : 'No'}</td>
                                            <td>{new Date(review.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="no-results">No reviews found matching your filters.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* --- Pagination Controls --- */}
                    {totalPages > 1 && (
                         <div className="pagination-controls">
                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                                Previous
                            </button>
                            <span>Page {currentPage} of {totalPages || 1}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default AdminViewAllReviews;