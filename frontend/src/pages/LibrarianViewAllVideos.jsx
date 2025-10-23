import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';
import '../styles/LibrarianViewAllMedia.css';
import EditVideoModal from './LibrarianEditVideo';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

function ViewAllVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [editingVideo, setEditingVideo] = useState(null);

  // source filter scoped to videos
  const [sourceFilter, setSourceFilter] = useState('');
  const [availableSources, setAvailableSources] = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch VIDEO sources only
  useEffect(() => {
    const fetchSources = async () => {
      setSourcesLoading(true);
      try {
        const { data } = await api.get('/librarian/video-sources');
        setAvailableSources(data || []);
      } catch (err) {
        console.error('Failed to fetch video sources:', err);
        setAvailableSources([]);
      } finally {
        setSourcesLoading(false);
      }
    };
    fetchSources();
  }, []);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        size: 10,
        search: debouncedSearchTerm || undefined,
        // only send if selected
        source: sourceFilter || undefined,
      };
      const { data } = await api.get('/librarian/view-all-videos', { params });
      setVideos(data.items || []);
      setTotalPages(Math.ceil((data.total || 0) / (params.size || 10)));
    } catch (err) {
      setError('Could not load videos.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, sourceFilter]);

  // Reset to page 1 on filter/search change
  useEffect(() => { setCurrentPage(1); }, [debouncedSearchTerm, sourceFilter]);

  // Load page
  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const handleUpdateVideo = (updatedVideo) => {
    setVideos((prev) => prev.map((v) => (v.id === updatedVideo.id ? updatedVideo : v)));
  };

  const handleDeleteVideo = (deletedVideoId) => {
    setVideos((prev) => prev.filter((v) => v.id !== deletedVideoId));
    fetchVideos(); // keep pagination accurate
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

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          disabled={sourcesLoading}
        >
          <option value="">Filter by source...</option>
          {availableSources.map((s) => (
            <option key={s} value={s}>{s}</option>
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
                  videos.map((video) => (
                    <tr key={video.id}>
                      <td>{video.title}</td>
                      <td>{video.category || 'N/A'}</td>
                      <td>{video.source || '—'}</td>
                      <td>
                        {typeof video.rating === 'number' ? video.rating.toFixed(1) : '—'}
                      </td>
                      <td>
                        <button className="btn-edit" onClick={() => setEditingVideo(video)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#6b7280' }}>
                      No videos found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-controls">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages || 1}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
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
