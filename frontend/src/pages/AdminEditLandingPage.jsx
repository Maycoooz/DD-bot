import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/AdminEditLandingPage.css';

function EditLandingPage() {
    const [contentItems, setContentItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // State for the new feature input fields
    const [newFreeFeatureText, setNewFreeFeatureText] = useState('');
    const [newProFeatureText, setNewProFeatureText] = useState('');

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
        setSuccess(''); // Clear message on new edit
    };

    const handleSave = async (id) => {
        setError('');
        setSuccess('');
        try {
            const itemToSave = contentItems.find(item => item.id === id);
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

    // Handler for adding a new pricing feature
    const handleAddFeature = async (groupingKey, text) => {
        if (!text.trim()) {
            setError('Feature text cannot be empty.');
            return;
        }
        setError('');
        setSuccess('');

        try {
            const payload = {
                display_type: 'PRICING',
                grouping_key: groupingKey,
                display_text: text,
            };
            const response = await api.post('/admin/landing-page-content', payload);
            
            setContentItems(prev => [...prev, response.data]);
            
            if (groupingKey === 'FREE_PLAN') {
                setNewFreeFeatureText('');
            } else {
                setNewProFeatureText('');
            }
            setSuccess('New feature added successfully!');

        } catch (err) {
            setError('Failed to add new feature.');
        }
    };

    // Renders a generic content group
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

    // Renders the pricing feature group with an "Add" form
    const renderPricingGroup = (groupingKey, title, newFeatureText, setNewFeatureText) => {
        const items = contentItems.filter(item => item.grouping_key === groupingKey);

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
                <div className="add-feature-form">
                    <input
                        type="text"
                        placeholder="Enter new feature text..."
                        value={newFeatureText}
                        onChange={(e) => setNewFeatureText(e.target.value)}
                    />
                    <button onClick={() => handleAddFeature(groupingKey, newFeatureText)}>Add Feature</button>
                </div>
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
            {renderPricingGroup('FREE_PLAN', 'Free Plan Features', newFreeFeatureText, setNewFreeFeatureText)}
            {renderPricingGroup('PRO_PLAN', 'Pro Plan Features', newProFeatureText, setNewProFeatureText)}
        </div>
    );
}

export default EditLandingPage;