import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import '../styles/LibrarianViewAllMedia.css';
import EditBookModal from './LibrarianEditBook';

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
};

function ViewAllBooks() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [editingBook, setEditingBook] = useState(null);
    
    const [sourceFilter, setSourceFilter] = useState('');
    const [availableSources, setAvailableSources] = useState([]);
    
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

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

    const fetchBooks = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                size: 10,
                search: debouncedSearchTerm,
                source: sourceFilter,
            };
            const response = await api.get('/librarian/view-all-books', { params });
            setBooks(response.data.items || []);
            setTotalPages(Math.ceil(response.data.total / params.size));
        } catch (err) {
            setError('Could not load books.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearchTerm, sourceFilter]);

    useEffect(() => { setCurrentPage(1); }, [debouncedSearchTerm, sourceFilter]);
    useEffect(() => { fetchBooks(); }, [fetchBooks]);

    const handleUpdateBook = (updatedBook) => {
        setBooks(currentBooks =>
            currentBooks.map(book => (book.id === updatedBook.id ? updatedBook : book))
        );
    };

    const handleDeleteBook = (deletedBookId) => {
        setBooks(currentBooks =>
            currentBooks.filter(book => book.id !== deletedBookId)
        );
    };

    return (
        <>
            <h2>View All Books</h2>
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

            {loading ? ( <div className="loading-state">Loading...</div> ) : 
             error ? ( <div className="error-state">{error}</div> ) : (
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
                                {books.map(book => (
                                    <tr key={book.id}>
                                        <td>{book.title}</td>
                                        <td>{book.category || 'N/A'}</td>
                                        <td>{book.source}</td>
                                        <td>{book.rating.toFixed(1)}</td>
                                        <td><button className="btn-edit" onClick={() => setEditingBook(book)}>Edit</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination-controls">
                        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</button>
                        <span>Page {currentPage} of {totalPages || 1}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>Next</button>
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