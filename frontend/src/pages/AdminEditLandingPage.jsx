import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/AdminEditLandingPage.css';

function EditLandingPage() {
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

    const handleInputChange = (id, field, value) => {
        setContentItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
        setSuccess('');
    };

    const handleSave = async (id) => {
        setError('');
        setSuccess('');
        try {
            const itemToSave = contentItems.find(item => item.id === id);
            
            // This payload is now more robust. It includes the title
            // only if it's defined for the item.
            const payload = {
                display_text: itemToSave.display_text,
            };
            if (itemToSave.title !== null && itemToSave.title !== undefined) {
                payload.title = itemToSave.title;
            }

            await api.put(`/admin/landing-page-content/${id}`, payload);
            setSuccess(`Content for '${itemToSave.title || itemToSave.display_type}' updated successfully!`);
        } catch (err) {
            setError(err.response?.data?.detail?.[0]?.msg || 'Failed to save content.');
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
                        {item.hasOwnProperty('title') && (
                             <input
                                type="text"
                                value={item.title || ''}
                                className="input-title"
                                onChange={(e) => handleInputChange(item.id, 'title', e.target.value)}
                                placeholder="Title..."
                            />
                        )}
                        <textarea
                            value={item.display_text}
                            onChange={(e) => handleInputChange(item.id, 'display_text', e.target.value)}
                            placeholder={item.hasOwnProperty('title') ? "Description..." : "Content..."}
                        />
                        <button onClick={() => handleSave(item.id)}>Save</button>
                    </div>
                ))}
            </div>
        );
    };

    const renderPricingGroup = (groupingKey, title) => {
        const items = contentItems.filter(item => item.grouping_key === groupingKey);
        if (items.length === 0) return null;

        return (
            <div className="content-section">
                <h3>{title}</h3>
                {items.map(item => (
                    <div key={item.id} className="content-item">
                        <textarea
                            value={item.display_text}
                            onChange={(e) => handleInputChange(item.id, 'display_text', e.target.value)}
                            placeholder="Feature description..."
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
            {renderGroup('VIDEO', 'Promo Video URL')}
            {renderGroup('FEATURE', 'Features')}
            {renderGroup('HOW_IT_WORKS', 'How It Works Steps')}
            {renderPricingGroup('FREE_PLAN', 'Free Plan Features')}
            {renderPricingGroup('PRO_PLAN', 'Pro Plan Features')}
        </div>
    );
}

export default EditLandingPage;