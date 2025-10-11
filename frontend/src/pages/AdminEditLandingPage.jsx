import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/AdminEditLandingPage.css';

function AdminEditLandingPage() {
    const [contentItems, setContentItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await api.get('/admin/landing-page-content');
                setContentItems(response.data);
            } catch (err) {
                setError('Failed to load content.');
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, []);

    const handleInputChange = (id, newText) => {
        setContentItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, display_text: newText } : item
            )
        );
    };

    const handleSave = async (id) => {
        setError('');
        setSuccess('');
        try {
            const itemToSave = contentItems.find(item => item.id === id);
            await api.put(`/admin/landing-page-content/${id}`, { display_text: itemToSave.display_text });
            setSuccess('Content updated successfully!');
            // Clear success message after a few seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to save content.');
        }
    };

    const renderGroup = (type, title) => {
        const items = contentItems.filter(item => item.display_type === type);
        if (items.length === 0) return null;

        return (
            <div className="content-section">
                <h3>{title}</h3>
                {items.map(item => (
                    <div key={item.id} className="content-item">
                        <textarea
                            value={item.display_text}
                            onChange={(e) => handleInputChange(item.id, e.target.value)}
                        />
                        <button onClick={() => handleSave(item.id)}>Save</button>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) return <div>Loading content editor...</div>;

    return (
        <div className="edit-landing-page">
            <h2>Edit Landing Page Content</h2>

            {error && <p className="message error">{error}</p>}
            {success && <p className="message success">{success}</p>}

            {renderGroup('INTRODUCTION', 'Introduction')}
            {renderGroup('FEATURE', 'Features')}
            {renderGroup('HOW_IT_WORKS', 'How It Works Steps')}
            {/* Add other groups like 'PRICING_FREE', 'PRICING_PRO' as needed */}
        </div>
    );
}

export default AdminEditLandingPage;