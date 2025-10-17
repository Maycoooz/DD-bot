import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';
import '../styles/ParentSearchMedia.css';
import ParentViewVideoModal from './ParentViewVideoModal';

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
};

function ParentSearchVideos() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [viewingVideo, setViewingVideo] = useState(null);

    const fetchVideos = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                size: 10,
                search: debouncedSearchTerm,
            };
            const response = await api.get('/librarian/view-all-videos', { params });
            setVideos(response.data.items || []);
            setTotalPages(Math.ceil(response.data.total / params.size));
        } catch (err) {
            setError('Could not load videos.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearchTerm]);

    useEffect(() => { setCurrentPage(1); }, [debouncedSearchTerm]);
    useEffect(() => { fetchVideos(); }, [fetchVideos]);

    return (
        <div className="search-page-container">
            <h2>Search for Videos</h2>
            <div className="search-bar-container">
                <input
                    type="text"
                    placeholder="Search by video title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? ( <div className="loading-state">Loading videos...</div> ) : 
             error ? ( <div className="error-state">{error}</div> ) : (
                <>
                    <div className="search-table-container">
                        <table className="search-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Creator</th>
                                    <th>Category</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {videos.length > 0 ? (
                                    videos.map(video => (
                                        <tr key={video.id}>
                                            <td>{video.title}</td>
                                            <td>{video.creator}</td>
                                            <td>{video.category || 'N/A'}</td>
                                            <td>
                                                <button className="btn-view" onClick={() => setViewingVideo(video)}>
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="no-results">No videos found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="pagination-controls">
                        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                            Previous
                        </button>
                        <span>Page {currentPage} of {totalPages || 1}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>
                            Next
                        </button>
                    </div>
                </>
            )}
            
            {viewingVideo && (
                <ParentViewVideoModal 
                    video={viewingVideo}
                    onClose={() => setViewingVideo(null)}
                />
            )}
        </div>
    );
}

export default ParentSearchVideos;