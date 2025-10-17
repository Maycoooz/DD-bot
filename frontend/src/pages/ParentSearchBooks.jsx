import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';
import '../styles/ParentSearchMedia.css'; 
import ParentViewBookModal from './ParentViewBookModal';

// A debounce hook to prevent API calls on every keystroke
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
};

function ParentSearchBooks() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [viewingBook, setViewingBook] = useState(null);

    const fetchBooks = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                size: 10,
                search: debouncedSearchTerm,
            };
            const response = await api.get('/librarian/view-all-books', { params });
            setBooks(response.data.items || []);
            setTotalPages(Math.ceil(response.data.total / params.size));
        } catch (err) {
            setError('Could not load books.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearchTerm]);

    useEffect(() => { setCurrentPage(1); }, [debouncedSearchTerm]);
    useEffect(() => { fetchBooks(); }, [fetchBooks]);

    return (
        <div className="search-page-container">
            <h2>Search for Books</h2>
            <div className="search-bar-container">
                <input
                    type="text"
                    placeholder="Search by book title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
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
                                            <td>
                                                <button className="btn-view" onClick={() => setViewingBook(book)}>
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="no-results">No books found.</td>
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

            {viewingBook && (
                <ParentViewBookModal 
                    book={viewingBook}
                    onClose={() => setViewingBook(null)}
                />
            )}
        </div>
    );
}

export default ParentSearchBooks;