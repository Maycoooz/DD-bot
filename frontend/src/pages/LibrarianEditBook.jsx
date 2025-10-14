import React, { useState } from 'react';
import api from '../api/axiosConfig';
import '../styles/LibrarianEditMedia.css'; // shared CSS file

function EditBookModal({ book, onClose, onUpdate, onDelete }) {
    const [formData, setFormData] = useState({
        title: book.title || '',
        author: book.author || '',
        link: book.link || '',
        age_group: book.age_group || '',
        category: book.category || '',
        description: book.description || '',
    });
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        try {
            const response = await api.patch(`/librarian/edit-book/${book.id}`, formData);
            onUpdate(response.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save changes.');
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete "${book.title}"? This action cannot be undone.`)) {
            try {
                await api.delete(`/librarian/delete-book/${book.id}`);
                onDelete(book.id);
                onClose();
            } catch (err) {
                setError(err.response?.data?.detail || 'Failed to delete book.');
            }
        }
    };

    return (
        <div className="modal-overlay">
            <div className="edit-media-modal">
                <div className="modal-header">
                    <h3>Edit Book</h3>
                    <button onClick={onClose} className="btn-back">Back</button>
                </div>
                <form onSubmit={handleSave} className="modal-form">
                    {error && <p className="form-message error">{error}</p>}
                    <div className="form-grid">
                        <div className="form-group"><label>Title</label><input type="text" name="title" value={formData.title} onChange={handleChange} /></div>
                        <div className="form-group"><label>Author</label><input type="text" name="author" value={formData.author} onChange={handleChange} /></div>
                        <div className="form-group"><label>Category</label><input type="text" name="category" value={formData.category} onChange={handleChange} /></div>
                        <div className="form-group"><label>Age Group</label><input type="text" name="age_group" value={formData.age_group} onChange={handleChange} /></div>
                        <div className="form-group full-width"><label>Link</label><input type="text" name="link" value={formData.link} onChange={handleChange} /></div>
                        <div className="form-group full-width"><label>Description</label><textarea name="description" value={formData.description} onChange={handleChange}></textarea></div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={handleDelete} className="btn-delete">Delete</button>
                        <button type="submit" className="btn-save" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditBookModal;