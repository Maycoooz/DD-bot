import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';
import '../styles/SearchMedia.css';
import ViewBookModal from './ViewBookModal';

// One-star + number
const StarRating = ({ value }) => {
  const v = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
  return (
    <span className="star-chip" title={`${v.toFixed(1)} / 5`} aria-label={`${v.toFixed(1)} out of 5`}>
      <span className="star-icon">★</span>
      <span className="star-number">{v ? v.toFixed(1) : '—'}</span>
    </span>
  );
};

// debounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
};

function SearchBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState('newest'); // 'newest' | 'rating'
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
      } else if (sortMode == 'oldest') {
        params.sort = 'oldest';
      } else {
        params.sort = "newest";
      }

      const response = await api.get('/librarian/view-all-books', { params });
      let items = response.data.items || [];

      // Fallback client-side sort when backend doesn't support sorting
      if (sortMode === 'rating') {
        items = [...items].sort((a, b) => {
          const ar = typeof a.rating === 'number' ? a.rating : -1;
          const br = typeof b.rating === 'number' ? b.rating : -1;
          return br - ar;
        });
      }

      setBooks(items);
      setTotalPages(Math.ceil(response.data.total / params.size));
    } catch (err) {
      setError('Could not load books.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, sortMode]);

  // reset to page 1 when search or sort changes
  useEffect(() => { setCurrentPage(1); }, [debouncedSearchTerm, sortMode]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  return (
    <div className="search-page-container">
      <h2>Search for Books</h2>

      <div className="search-bar-container" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by book title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1 }}
        />
        <label style={{ whiteSpace: 'nowrap', fontSize: 14, color: '#4b5563' }}>Sort by</label>
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db' }}
          aria-label="Sort books"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state">Loading books...</div>
      ) : error ? (
        <div className="error-state">{error}</div>
      ) : (
        <>
          <div className="search-table-container">
            <table className="search-table">
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
                  books.map(book => (
                    <tr key={book.id}>
                      <td>{book.title}</td>
                      <td>{book.author}</td>
                      <td>{book.category || 'N/A'}</td>
                      <td>{book.age_group || 'N/A'}</td>
                      <td><StarRating value={book.rating} /></td>
                      <td>
                        <button className="btn-view" onClick={() => setViewingBook(book)}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-results">No books found.</td>
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
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </button>
          </div>
        </>
      )}

      {viewingBook && (
        <ViewBookModal
          book={viewingBook}
          onClose={() => setViewingBook(null)}
        />
      )}

      {/* tiny star styles*/}
      <style>{`
        .star-chip { display: inline-flex; align-items: center; gap: 6px; }
        .star-icon { color: #ffc107; font-size: 16px; line-height: 1; }
        .star-number { font-size: 12px; color: #4b5563; }
      `}</style>
    </div>
  );
}

export default SearchBooks;