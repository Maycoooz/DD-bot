import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/AdminEditLandingPage.css';

function EditLandingPage() {
  const [contentItems, setContentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New-feature input fields
  const [newFreeFeatureText, setNewFreeFeatureText] = useState('');
  const [newProFeatureText, setNewProFeatureText] = useState('');

  // Draft for Premium price (when creating)
  const [proPriceDraft, setProPriceDraft] = useState('9.99');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data } = await api.get('/admin/landing-page-content');
        setContentItems(data);

        // Prefill premium draft if we already have a value
        const pro = data.find(
          i => i.display_type === 'PRICING' && i.grouping_key === 'PRO_PRICE'
        );
        if (pro?.display_text) setProPriceDraft(String(pro.display_text));
      } catch (err) {
        setError('Failed to load content.');
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleInputChange = (id, field, value) => {
    setContentItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
    setSuccess(''); // clear success when editing
  };

  const handleSave = async (id) => {
    clearMessages();
    try {
      const itemToSave = contentItems.find(item => item.id === id);
      if (!itemToSave) return;

      const payload = { display_text: itemToSave.display_text };
      if (itemToSave.title !== null && itemToSave.title !== undefined) {
        payload.title = itemToSave.title;
      }

      await api.put(`/admin/landing-page-content/${id}`, payload);
      setSuccess(`Content for '${itemToSave.title || itemToSave.display_type}' updated successfully!`);
    } catch (err) {
      setError(err?.response?.data?.detail?.[0]?.msg || 'Failed to save content.');
    }
  };

  // ----- Pricing helpers -----
  const getPriceItem = (key) =>
    contentItems.find(
      (i) => i.display_type === 'PRICING' && i.grouping_key === key
    );

  const createPrice = async (key, value) => {
    clearMessages();
    try {
      const payload = {
        display_type: 'PRICING',
        grouping_key: key,        // 'PRO_PRICE'
        title: 'PRICE',
        display_text: String(value),
      };
      const { data } = await api.post('/admin/landing-page-content', payload);
      setContentItems(prev => [...prev, data]);
      setSuccess('Price created successfully.');
    } catch (err) {
      setError('Failed to create price.');
    }
  };

  // ----- Feature add (Free & Pro) -----
  const handleAddFeature = async (groupingKey, text) => {
    if (!text.trim()) {
      setError('Feature text cannot be empty.');
      return;
    }
    clearMessages();

    try {
      const payload = {
        display_type: 'PRICING',
        grouping_key: groupingKey, // 'FREE_PLAN' or 'PRO_PLAN'
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

  // ----- Renderers -----
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

  const renderFreePlanFeatures = () => {
    const items = contentItems.filter(item => item.grouping_key === 'FREE_PLAN');
    return (
      <div className="content-section">
        <h3>Free Plan Features</h3>
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
            value={newFreeFeatureText}
            onChange={(e) => setNewFreeFeatureText(e.target.value)}
          />
          <button onClick={() => handleAddFeature('FREE_PLAN', newFreeFeatureText)}>
            Add Feature
          </button>
        </div>
      </div>
    );
  };

  const renderProPlanFeatures = () => {
    const items = contentItems.filter(item => item.grouping_key === 'PRO_PLAN');
    return (
      <div className="content-section">
        <h3>Pro Plan Features</h3>
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
            value={newProFeatureText}
            onChange={(e) => setNewProFeatureText(e.target.value)}
          />
          <button onClick={() => handleAddFeature('PRO_PLAN', newProFeatureText)}>
            Add Feature
          </button>
        </div>
      </div>
    );
  };

  const renderPlanPrices = () => {
    const proItem  = getPriceItem('PRO_PRICE');

    return (
      <div className="content-section">
        <h3>Pro Plan Price</h3>

        {/* Premium plan price (editable/create) */}
        <div className="content-item">
          <label className="input-title">Premium Plan Price ($/month)</label>
          {proItem ? (
            <>
              <input
                type="number"
                step="0.01"
                value={proItem.display_text}
                onChange={(e) => handleInputChange(proItem.id, 'display_text', e.target.value)}
              />
              <button onClick={() => handleSave(proItem.id)}>Save Premium Price</button>
            </>
          ) : (
            <>
              <input
                type="number"
                step="0.01"
                value={proPriceDraft}
                onChange={(e) => setProPriceDraft(e.target.value)}
                placeholder="9.99"
              />
              <button onClick={() => createPrice('PRO_PRICE', proPriceDraft)}>
                Create Premium Price
              </button>
            </>
          )}
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

      {/* Free & Pro plan features */}
      {renderFreePlanFeatures()}
      {renderProPlanFeatures()}

      {/* Only Pro plan price */}
      {renderPlanPrices()}
    </div>
  );
}

export default EditLandingPage;
