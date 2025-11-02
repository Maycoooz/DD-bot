// src/components/ParentProfile.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/ParentProfile.css';
import ChangePasswordModal from './ChangePasswordModal';
import TierChangeModal from './TierChangeModal';

// --- Options (short lists; extend as you wish) ---
const COUNTRIES = [
  'Singapore','United States','United Kingdom','Australia','Canada',
  'China','India','Indonesia','Malaysia','Philippines','Vietnam','Thailand',
  'Japan','South Korea','Germany','France','Italy','Spain','Netherlands',
  'United Arab Emirates','Saudi Arabia','Brazil','Mexico','South Africa',
  'New Zealand','Other'
];
const RACES = [
  'Asian','Black / African','White / European','Hispanic / Latino',
  'Middle Eastern / North African','Pacific Islander','Mixed / Multiracial',
  'Prefer not to say','Other'
];
const GENDERS = ['Male','Female','Other','Prefer not to say'];
const OTHER_VALUE = '__other__';

function ParentProfile({ onProfileUpdate }) {
  // pull from localStorage first just for instant paint
  const initialProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  const [profileData, setProfileData] = useState(initialProfile);

  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // tier modal state
  const [showTierModal, setShowTierModal] = useState(false);
  const [tierPreview, setTierPreview] = useState(null);
  const [isTierSubmitting, setIsTierSubmitting] = useState(false);
  const [selectedKeepChildId, setSelectedKeepChildId] = useState(null);

  // local UI state for custom "Other" entries
  const [customCountry, setCustomCountry] = useState('');
  const [customRace, setCustomRace] = useState('');

  // Is parent if there is no primary_parent_id
  const isParent = !profileData?.primary_parent_id;

  // fields required for profile save
  const requiredForParent = ['first_name','last_name','country','gender','birthday','race'];

  // Fetch parent profile fresh from backend (/parent/me)
  const fetchLatestProfile = async () => {
    try {
      const response = await api.get('/parent/me');
      const latestProfile = response.data;
      setProfileData(latestProfile);
      localStorage.setItem('userProfile', JSON.stringify(latestProfile));

      // seed custom inputs with existing values if not in our canned lists
      if (latestProfile.country && !COUNTRIES.includes(latestProfile.country)) {
        setCustomCountry(latestProfile.country);
      }
      if (latestProfile.race && !RACES.includes(latestProfile.race)) {
        setCustomRace(latestProfile.race);
      }
    } catch (error) {
      setMessage('Failed to load profile data.');
    }
  };

  // On first mount refresh from server
  useEffect(() => {
    fetchLatestProfile();
  }, []);

  // Handle changes to input fields when editing profile info
  const handleChange = (e) => {
    const { name, value } = e.target;

    // country/race: convert "Other" sentinel value
    if (name === 'country') {
      setProfileData((prev) => ({
        ...prev,
        country: value === OTHER_VALUE ? OTHER_VALUE : value,
      }));
      return;
    }
    if (name === 'race') {
      setProfileData((prev) => ({
        ...prev,
        race: value === OTHER_VALUE ? OTHER_VALUE : value,
      }));
      return;
    }

    setProfileData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Save profile updates (name, birthday, etc.) via /users/me/
  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage('');

    // validate required fields incl. "Other" text boxes
    const missing = requiredForParent.filter((key) => {
      if (key === 'country' && profileData.country === OTHER_VALUE) {
        return !customCountry.trim();
      }
      if (key === 'race' && profileData.race === OTHER_VALUE) {
        return !customRace.trim();
      }
      return !profileData[key] || profileData[key].toString().trim() === '';
    });
    if (missing.length > 0) {
      setMessage(
        `Error: The following fields are required: ${missing.join(', ')}.`
      );
      return;
    }

    const excludedFields = [
      'id','username','email','role','role_name','tier','hashed_password',
      'primary_parent_id','children'
    ];
    const dataToSend = {};

    // build payload; resolve "Other" -> custom values
    for (const key in profileData) {
      if (excludedFields.includes(key)) continue;

      let value = profileData[key];

      if (key === 'country') {
        value = value === OTHER_VALUE
          ? (customCountry.trim() || null)
          : (value?.toString().trim() || null);
      } else if (key === 'race') {
        value = value === OTHER_VALUE
          ? (customRace.trim() || null)
          : (value?.toString().trim() || null);
      } else {
        value = value?.toString().trim() ? value : null;
      }

      dataToSend[key] = value;
    }

    try {
      // patch generic profile info
      await api.patch('/users/me/', dataToSend);

      // re-fetch canonical parent view (includes tier)
      await fetchLatestProfile();

      setIsEditing(false);
      setMessage('Profile successfully updated!');
      if (onProfileUpdate) onProfileUpdate(profileData);
    } catch (err) {
      let detail = err.response?.data?.detail || 'Update failed.';
      if (Array.isArray(err.response?.data?.detail)) {
        detail =
          'Server Validation Error: ' +
          err.response.data.detail
            .map((e) => `${e.loc[e.loc.length - 1]} (${e.msg})`)
            .join('; ');
      }
      setMessage(`Error: ${detail}`);
      console.error('Update error:', err.response || err);
    }
  };

  // ------------------------
  // Tier change flow
  // ------------------------
  const handleOpenTierModal = async () => {
    if (!isParent) return;
    const currentTier = profileData.tier || 'FREE';
    const targetTier = currentTier === 'PRO' ? 'FREE' : 'PRO';

    setMessage('');
    setShowTierModal(true);
    setTierPreview(null);
    setSelectedKeepChildId(null);

    try {
      const res = await api.get('/parent/tier-preview', {
        params: { target_tier: targetTier },
      });
      setTierPreview(res.data || null);
    } catch (err) {
      console.error('Failed to load tier preview:', err);
      setTierPreview({
        current_tier: currentTier,
        target_tier: targetTier,
        gain_features: [],
        lose_features: [],
        requires_child_choice: false,
        children: [],
        max_children_allowed: 1,
      });
      setMessage(
        err.response?.data?.detail || 'Error loading upgrade/downgrade info.'
      );
    }
  };

  const handleConfirmTierChange = async () => {
    if (!tierPreview) return;
    setIsTierSubmitting(true);
    setMessage('');

    try {
      const body = {
        target_tier: tierPreview.target_tier,
        keep_child_id:
          tierPreview.requires_child_choice && selectedKeepChildId
            ? selectedKeepChildId
            : undefined,
      };

      const res = await api.patch('/parent/change-tier', body);
      const updatedProfile = res.data;
      setProfileData(updatedProfile);
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));

      setShowTierModal(false);
      setTierPreview(null);
      setSelectedKeepChildId(null);
      setIsTierSubmitting(false);

      setMessage(
        `Subscription tier updated to ${updatedProfile.tier || 'FREE'} successfully.`
      );

      if (onProfileUpdate) onProfileUpdate(updatedProfile);
    } catch (err) {
      console.error('Tier change failed:', err);

      const statusCode = err.response?.status;
      const detail = err.response?.data?.detail;

      if (
        statusCode === 400 &&
        typeof detail === 'string' &&
        detail.toLowerCase().includes('multiple child')
      ) {
        setMessage(`Error: ${detail}`);
        setTierPreview((prev) => (prev ? { ...prev, requires_child_choice: true } : prev));
        setIsTierSubmitting(false);
        return;
      }

      setMessage(`Error: ${detail || 'Failed to change subscription tier.'}`);
      setIsTierSubmitting(false);
    }
  };

  // ------------------------
  // Render helpers
  // ------------------------

  // Generic text/date display or input for non-select fields
  const renderField = (label, key) => {
    const isRequired = requiredForParent.includes(key);
    const value = profileData[key] || '';
    const inputType = key === 'birthday' ? 'date' : 'text';

    // For select fields we handle separately below
    if (['country', 'gender', 'race'].includes(key)) return null;

    return (
      <div className="profile-field" key={key}>
        <label>{label}:</label>
        {isEditing ? (
          <input
            type={inputType}
            name={key}
            value={value}
            onChange={handleChange}
            required={isRequired}
            placeholder={value === '' && !isRequired ? 'Not provided' : undefined}
          />
        ) : (
          <span className="profile-value">{value || 'Not provided'}</span>
        )}
      </div>
    );
  };

  // Country select + custom input
  const renderCountry = () => {
    const current = profileData.country || '';
    const selectValue =
      isEditing && current && !COUNTRIES.includes(current) ? OTHER_VALUE : current;

    return (
      <div className="profile-field" key="country">
        <label>COUNTRY:</label>
        {isEditing ? (
          <>
            <select
              name="country"
              value={selectValue}
              onChange={handleChange}
              required
            >
              <option value="">Select country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c === 'Other' ? OTHER_VALUE : c}>
                  {c}
                </option>
              ))}
            </select>
            { (profileData.country === OTHER_VALUE ||
               (!COUNTRIES.includes(current) && current) ) && (
              <input
                type="text"
                placeholder="Type your country"
                value={customCountry}
                onChange={(e) => setCustomCountry(e.target.value)}
                style={{ marginTop: 8 }}
                required
              />
            )}
          </>
        ) : (
          <span className="profile-value">{current || 'Not provided'}</span>
        )}
      </div>
    );
  };

  // Gender select
  const renderGender = () => {
    const current = profileData.gender || '';
    return (
      <div className="profile-field" key="gender">
        <label>GENDER:</label>
        {isEditing ? (
          <select name="gender" value={current} onChange={handleChange} required>
            <option value="">Select gender</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        ) : (
          <span className="profile-value">{current || 'Not provided'}</span>
        )}
      </div>
    );
  };

  // Race select + custom input
  const renderRace = () => {
    const current = profileData.race || '';
    const selectValue =
      isEditing && current && !RACES.includes(current) ? OTHER_VALUE : current;

    return (
      <div className="profile-field" key="race">
        <label>RACE:</label>
        {isEditing ? (
          <>
            <select
              name="race"
              value={selectValue}
              onChange={handleChange}
              required
            >
              <option value="">Select race / ethnicity</option>
              {RACES.map((r) => (
                <option key={r} value={r === 'Other' ? OTHER_VALUE : r}>
                  {r}
                </option>
              ))}
            </select>
            { (profileData.race === OTHER_VALUE ||
               (!RACES.includes(current) && current) ) && (
              <input
                type="text"
                placeholder="Type your race / ethnicity"
                value={customRace}
                onChange={(e) => setCustomRace(e.target.value)}
                style={{ marginTop: 8 }}
                required
              />
            )}
          </>
        ) : (
          <span className="profile-value">{current || 'Not provided'}</span>
        )}
      </div>
    );
  };

  // Subscription Tier row with Upgrade/Downgrade button
  const renderTierRow = () => {
    const currentTier = profileData.tier || 'FREE';
    const buttonText = currentTier === 'PRO' ? 'Switch to Free' : 'Upgrade to Pro';

    return (
      <div className="profile-field subscription-tier-row" key="subscription_tier_row">
        <label>SUBSCRIPTION TIER:</label>
        <div className="subscription-tier-value-row">
          <span className="profile-value tier-inline">{currentTier}</span>
          {!isEditing && isParent && (
            <button
              type="button"
              className={currentTier === 'PRO' ? 'btn-downgrade' : 'btn-upgrade'}
              onClick={handleOpenTierModal}
            >
              {buttonText}
            </button>
          )}
        </div>
      </div>
    );
  };

  // ------------------------
  // JSX
  // ------------------------
  return (
    <div className="profile-view">
      <h3>My Profile Details</h3>

      {message && (
        <p className={`message ${message.startsWith('Error') ? 'error' : 'success'}`}>
          {message}
        </p>
      )}

      <div className="profile-actions">
        {isEditing ? (
          <button onClick={handleUpdate} className="btn-primary" type="button">
            Save Profile
          </button>
        ) : (
          <>
            <button onClick={() => setIsEditing(true)} className="btn-primary" type="button">
              Edit Profile
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="btn-secondary"
              type="button"
            >
              Change Password
            </button>
          </>
        )}
      </div>

      <form
        id="profile-form"
        onSubmit={isEditing ? handleUpdate : (e) => e.preventDefault()}
        className="profile-grid"
      >
        {renderField('USERNAME', 'username')}
        {renderField('EMAIL', 'email')}
        {renderField('FIRST NAME', 'first_name')}
        {renderField('LAST NAME', 'last_name')}

        {renderCountry()}
        {renderGender()}
        {renderField('BIRTHDAY', 'birthday')}
        {renderRace()}

        {renderTierRow()}
      </form>

      {showPasswordModal && profileData.id && (
        <ChangePasswordModal
          userId={profileData.id}
          username={profileData.username}
          onClose={() => setShowPasswordModal(false)}
        />
      )}

      <TierChangeModal
        isOpen={showTierModal}
        onClose={() => {
          if (!isTierSubmitting) {
            setShowTierModal(false);
            setTierPreview(null);
            setSelectedKeepChildId(null);
          }
        }}
        previewData={tierPreview}
        isSubmitting={isTierSubmitting}
        selectedKeepChildId={selectedKeepChildId}
        setSelectedKeepChildId={setSelectedKeepChildId}
        onConfirm={handleConfirmTierChange}
      />
    </div>
  );
}

export default ParentProfile;
