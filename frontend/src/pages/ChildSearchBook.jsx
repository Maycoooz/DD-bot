// ChildSearchBook.jsx
import React, { useState } from "react";
import api from "../api/axiosConfig";

/**
 * NOTE: Component function name kept as `SearchBooks`
 * so any code expecting that name won't be affected.
 */
export default function SearchBooks() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  // Fetch books from your backend (adapt endpoint as needed)
  async function fetchBooks(q) {
    setIsLoading(true);
    setError(null);
    try {
      // Example API call - adjust endpoint/query params to match your backend
      const res = await api.get("/books/search", {
        params: { q },
      });
      setResults(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchBooks error:", err);
      setError("Failed to search books");
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
    fetchBooks(q);
  }

  function handleSelectBook(book) {
    // Placeholder: user can wire this to add to favorites, open detail modal, etc.
    // Do not modify function name if other parts rely on it.
    console.log("Selected book:", book);
  }

  return (
    <div className="child-search-modal">
      <h3>Search Books</h3>

      <form onSubmit={handleSubmit} className="child-search-form">
        <input
          type="search"
          className="child-dashboard__search"
          placeholder="Search books..."
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

      {isLoading && <p>Searching books…</p>}
      {error && <p className="error">{error}</p>}

      <ul className="child-search-results" role="list">
        {results.length === 0 && !isLoading && <li>No books found</li>}
        {results.map((b) => (
          <li key={b.id || b.link || Math.random()} className="child-search-item">
            <div className="child-search-item-title">{b.title || "Untitled"}</div>
            {b.authors && <div className="child-search-item-meta">By {b.authors}</div>}
            <div className="child-search-item-actions">
              <button
                className="child-dashboard__btn child-dashboard__btn--small"
                onClick={() => handleSelectBook(b)}
              >
                Select
              </button>
              {b.link && (
                <a
                  className="child-dashboard__chip"
                  href={b.link}
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
