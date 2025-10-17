import React from 'react';
import '../styles/ParentViewBookModal.css'; // We will create this CSS file next

function ParentViewBookModal({ book, onClose }) {
    return (
        <div className="modal-overlay">
            <div className="view-book-modal">
                <div className="modal-header">
                    <h3>{book.title}</h3>
                    <button onClick={onClose} className="btn-close">&times;</button>
                </div>
                <div className="modal-body">
                    <div className="detail-item">
                        <label>Author</label>
                        <span>{book.author}</span>
                    </div>
                    <div className="detail-item">
                        <label>Category</label>
                        <span>{book.category || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <label>Age Group</label>
                        <span>{book.age_group || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <label>Description</label>
                        <p>{book.description || 'No description available.'}</p>
                    </div>
                </div>
                <div className="modal-footer">
                    <a href={book.link} target="_blank" rel="noopener noreferrer" className="btn-view-link">
                        View on Store
                    </a>
                </div>
            </div>
        </div>
    );
}

export default ParentViewBookModal;