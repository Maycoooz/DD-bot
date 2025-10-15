import React, { useState } from 'react';
import api from '../api/axiosConfig';
import '../styles/LibrarianAddVideo.css';

function AddVideoModal({ onClose, onVideoAdded }) {
    const [formData, setFormData] = useState({
        title: '',
        creator: '',
        link: '',
        age_group: '',
        category: '',
        description: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        try {
            await api.post('/librarian/add-video', formData);
            setSuccess(`'${formData.title}' has been added successfully.`);
            onVideoAdded();
            setFormData({
                title: '', creator: '', link: '', age_group: '',
                category: '', description: '',
            });

        } catch (err) {
            const detail = err.response?.data?.detail || 'Failed to add video. Please check the fields.';
            setError(detail);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="add-video-modal">
                <div className="modal-header">
                    <h2>Add New Video</h2>
                    <button onClick={onClose} className="btn-close" disabled={isSubmitting}>&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="modal-form">
                    {error && <p className="form-message error">{error}</p>}
                    {success && <p className="form-message success">{success}</p>}

                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="title">Title</label>
                            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required disabled={isSubmitting} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="creator">Creator</label>
                            <input type="text" id="creator" name="creator" value={formData.creator} onChange={handleChange} required disabled={isSubmitting} />
                        </div>
                        <div className="form-group full-width">
                            <label htmlFor="link">Link</label>
                            <input type="text" id="link" name="link" value={formData.link} onChange={handleChange} required disabled={isSubmitting} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="age_group">Age Group</label>
                            <input type="text" id="age_group" name="age_group" value={formData.age_group} onChange={handleChange} disabled={isSubmitting} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="category">Category</label>
                            <input type="text" id="category" name="category" value={formData.category} onChange={handleChange} disabled={isSubmitting} />
                        </div>
                        <div className="form-group full-width">
                            <label htmlFor="description">Description</label>
                            <textarea id="description" name="description" value={formData.description} onChange={handleChange} disabled={isSubmitting}></textarea>
                        </div>
                    </div>
                    
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>Close</button>
                        <button type="submit" className="btn-save" disabled={isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Add Video'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddVideoModal;