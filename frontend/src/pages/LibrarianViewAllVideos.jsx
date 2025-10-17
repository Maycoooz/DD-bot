import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import '../styles/LibrarianViewAllMedia.css'; 
import EditVideoModal from './LibrarianEditVideo';

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
};

function ViewAllVideos() {
    const navigate = useNavigate();
    
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [editingVideo, setEditingVideo] = useState(null);

    const [sourceFilter, setSourceFilter] = useState('');
    const [availableSources, setAvailableSources] = useState([]);
    
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Fetch the list of available sources on component mount 
    useEffect(() => {
        const fetchSources = async () => {
            try {
                const response = await api.get('/librarian/media-sources');
                setAvailableSources(response.data);
            } catch (err) {
                console.error("Failed to fetch media sources:", err);
            }
        };
        fetchSources();
    }, []);

    const fetchVideos = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                size: 10,
                search: debouncedSearchTerm,
                source: sourceFilter, // Add source to API params
            };
            const response = await api.get('/librarian/view-all-videos', { params });
            setVideos(response.data.items || []);
            setTotalPages(Math.ceil(response.data.total / params.size));
        } catch (err) {
            setError('Could not load videos.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearchTerm, sourceFilter]); // Add sourceFilter to dependencies

    useEffect(() => { setCurrentPage(1); }, [debouncedSearchTerm, sourceFilter]);
    useEffect(() => { fetchVideos(); }, [fetchVideos]);
    
    const handleUpdateVideo = (updatedVideo) => {
        setVideos(currentVideos =>
            currentVideos.map(video => (video.id === updatedVideo.id ? updatedVideo : video))
        );
    };

    const handleDeleteVideo = (deletedVideoId) => {
        setVideos(currentVideos =>
            currentVideos.filter(video => video.id !== deletedVideoId)
        );
        fetchVideos(); // Re-fetch to keep pagination accurate
    };

    return (
        <>
            <h2>View All Videos</h2>
            <div className="filters-container">
                <input
                    type="text"
                    placeholder="Search by Title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
                    <option value="">Filter by source...</option>
                    {availableSources.map(source => (
                        <option key={source} value={source}>{source}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="loading-state">Loading...</div>
            ) : error ? (
                <div className="error-state">{error}</div>
            ) : (
                <>
                    <div className="media-table-container">
                        <table className="media-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Added By</th>
                                    <th>Stars</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {videos.length > 0 ? (
                                    videos.map(video => (
                                        <tr key={video.id}>
                                            <td>{video.title}</td>
                                            <td>{video.category || 'N/A'}</td>
                                            <td>{video.source}</td>
                                            <td>{video.rating.toFixed(1)}</td>
                                            <td>
                                                <button className="btn-edit" onClick={() => setEditingVideo(video)}>Edit</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center' }}>No videos found.</td>
                                    </tr>
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

            {editingVideo && (
                <EditVideoModal
                    video={editingVideo}
                    onClose={() => setEditingVideo(null)}
                    onUpdate={handleUpdateVideo}
                    onDelete={handleDeleteVideo}
                />
            )}
        </>
    );
}

export default ViewAllVideos;