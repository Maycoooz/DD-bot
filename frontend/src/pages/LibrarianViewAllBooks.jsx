import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import '../styles/LibrarianViewAllMedia.css';
import EditBookModal from './LibrarianEditBook';

// A debounce hook to prevent excessive API calls while typing
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

function ViewAllBooks() {
    const navigate = useNavigate();
    
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // State for search and pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // State for the edit modal
    const [editingBook, setEditingBook] = useState(null);

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

    useEffect(() => {
        // Reset to page 1 whenever the search term changes
        setCurrentPage(1);
    }, [debouncedSearchTerm]);

    useEffect(() => {
        fetchBooks();
    }, [fetchBooks]);

    // Handler to update a book in the list after editing
    const handleUpdateBook = (updatedBook) => {
        setBooks(currentBooks =>
            currentBooks.map(book => (book.id === updatedBook.id ? updatedBook : book))
        );
    };

    // Handler to remove a book from the list after deleting
    const handleDeleteBook = (deletedBookId) => {
        setBooks(currentBooks =>
            currentBooks.filter(book => book.id !== deletedBookId)
        );
        // Optional: Re-fetch stats if total count needs to be updated immediately
    };

    return (
        <>
            <h2>View All Books</h2>
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search by Title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
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
                                {books.length > 0 ? (
                                    books.map(book => (
                                        <tr key={book.id}>
                                            <td>{book.title}</td>
                                            <td>{book.category || 'N/A'}</td>
                                            <td>{book.source}</td>
                                            <td>{book.rating.toFixed(1)}</td>
                                            <td>
                                                <button className="btn-edit" onClick={() => setEditingBook(book)}>Edit</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center' }}>No books found.</td>
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

            {editingBook && (
                <EditBookModal
                    book={editingBook}
                    onClose={() => setEditingBook(null)}
                    onUpdate={handleUpdateBook}
                    onDelete={handleDeleteBook}
                />
            )}
        </>
    );
}

export default ViewAllBooks;