// ChildSearchVideo.jsx
import React, { useState } from "react";
import api from "../api/axiosConfig";

/**
 * NOTE: Component function name kept as `SearchVideos`
 * so any code expecting that name won't be affected.
 */
export default function SearchVideos() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  async function fetchVideos(q) {
    setIsLoading(true);
    setError(null);
    try {
      // Example API call - adjust endpoint/query params to match your backend
      const res = await api.get("/videos/search", {
        params: { q },
      });
      setResults(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchVideos error:", err);
      setError("Failed to search videos");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearchChange(e) {
    setQuery(e.target.value);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const q = (query || "").trim();
    if (!q) {
      setResults([]);
      return;
    }
    fetchVideos(q);
  }

  function handlePlayVideo(video) {
    // Placeholder: wire this into your video player or open in new tab
    console.log("Play video:", video);
    if (video.link) window.open(video.link, "_blank", "noreferrer");
  }

  return (
    <div className="child-search-modal">
      <h3>Search Videos</h3>

      <form onSubmit={handleSubmit} className="child-search-form">
        <input
          type="search"
          className="child-dashboard__search"
          placeholder="Search videos..."
          value={query}
          onChange={handleSearchChange}
        />
        <button
          type="submit"
          className="child-dashboard__btn child-dashboard__btn--small"
          disabled={isLoading}
        >
          Search
        </button>
      </form>

      {isLoading && <p>Searching videos…</p>}
      {error && <p className="error">{error}</p>}

      <ul className="child-search-results" role="list">
        {results.length === 0 && !isLoading && <li>No videos found</li>}
        {results.map((v) => (
          <li key={v.id || v.link || Math.random()} className="child-search-item">
            <div className="child-search-item-title">{v.title || "Untitled"}</div>
            {v.duration && <div className="child-search-item-meta">Duration: {v.duration}</div>}
            <div className="child-search-item-actions">
              <button
                className="child-dashboard__btn child-dashboard__btn--small"
                onClick={() => handlePlayVideo(v)}
              >
                Play
              </button>
              {v.link && (
                <a
                  className="child-dashboard__chip"
                  href={v.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  More
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
