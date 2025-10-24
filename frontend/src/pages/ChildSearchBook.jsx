//frontend/src/pages/ChildSearchBook.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';
import '../styles/ChildrenDashboard.css';
import ViewBookModal from './ViewBookModal';

// --- Star rating display ---
const StarRating = ({ value }) => {
  const v = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
  return (
    <span className="star-chip" title={`${v.toFixed(1)} / 5`} aria-label={`${v.toFixed(1)} out of 5`}>
      <span className="star-icon">★</span>
      <span className="star-number">{v ? v.toFixed(1) : '—'}</span>
    </span>
  );
};

// --- Debounce hook ---
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
};

export default function ChildSearchBook() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [viewingBook, setViewingBook] = useState(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        size: 10,
        search: debouncedSearchTerm,
      };

      if (sortMode === 'rating') {
        params.sort = 'rating';
        params.direction = 'desc';
      } else if (sortMode === 'oldest') {
        params.sort = 'oldest';
      } else {
        params.sort = 'newest';
      }

      const response = await api.get('/librarian/view-all-books', { params });
      let items = response.data.items || [];

      if (sortMode === 'rating') {
        items = [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }

      setBooks(items);
      setTotalPages(Math.ceil(response.data.total / params.size));
    } catch (err) {
      setError('Could not load books.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, sortMode]);

  useEffect(() => setCurrentPage(1), [debouncedSearchTerm, sortMode]);
  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  return (
    <div className="child-search-modal">
      <h3>Search Books</h3>

      <div className="child-search-bar">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="child-dashboard__search"
        />
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value)}
          className="child-dashboard__select"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {loading ? (
        <p>Loading books...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          <table className="child-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Age Group</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.length > 0 ? (
                books.map((book) => (
                  <tr key={book.id}>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.category || 'N/A'}</td>
                    <td>{book.age_group || 'N/A'}</td>
                    <td><StarRating value={book.rating} /></td>
                    <td className="child-dashboard__actions">
  <button
    className="child-dashboard__btn child-dashboard__btn--small"
    onClick={() => setViewingBook(book)}
  >
    View
  </button>
  <button
    className="child-dashboard__btn child-dashboard__btn--small child-dashboard__btn--favorite"
    onClick={() => addToFavorite(book.id)}
  >
    ❤️ Favorite
  </button>
</td>


                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No books found.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="pagination-controls">
            <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
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

      {viewingBook && <ViewBookModal book={viewingBook} onClose={() => setViewingBook(null)} />}

      <style>{`
        .star-chip { display: inline-flex; align-items: center; gap: 4px; }
        .star-icon { color: #ffc107; font-size: 16px; }
        .star-number { font-size: 12px; color: #555; }
      `}</style>
    </div>
  );
}
async function addToFavorite(bookId) {
  try {
    const res = await api.post(`/child/${userId}/favorites/books`, { book_id: bookId });
    alert("✅ Book added to favorites!");
  } catch (err) {
    console.error(err);
    alert("❌ Failed to add favorite.");
  }
}

