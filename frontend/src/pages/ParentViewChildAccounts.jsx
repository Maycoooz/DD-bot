import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/ParentViewChildAccounts.css';

/* --- Select option lists --- */
const COUNTRIES = [
  'Singapore','United States','United Kingdom','Australia','Canada',
  'China','India','Indonesia','Malaysia','Philippines','Vietnam','Thailand',
  'Japan','South Korea','Germany','France','Italy','Spain','Netherlands',
  'United Arab Emirates','Saudi Arabia','Brazil','Mexico','South Africa',
  'New Zealand','Other'
];

// General set; refine if you keep a localised list elsewhere
const RACES = [
  'Asian','White / European','Black / African','Hispanic / Latino',
  'Middle Eastern / North African','Pacific Islander','Mixed / Multiracial',
  'Prefer not to say','Other'
];

const GENDERS = ['Male','Female','Other','Prefer not to say'];
const OTHER_VALUE = '__other__';

// fields we allow user to edit & send to backend
const EDITABLE_FIELDS = [
  'username',
  'first_name',
  'last_name',
  'birthday',
  'country',
  'gender',
  'race',
  'interests',
];

function ViewChildAccounts() {
  // --- STATE MANAGEMENT ---
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editing Profile State
  const [editingChildId, setEditingChildId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Deleting Account State
  const [childToDelete, setChildToDelete] = useState(null);
  
  // Change Password State
  const [childForPasswordChange, setChildForPasswordChange] = useState(null);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });
  const [passwordError, setPasswordError] = useState('');

  // Interests
  const [availableInterests, setAvailableInterests] = useState([]);

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [childrenResponse, interestsResponse] = await Promise.all([
          api.get('/parent/my-children'),
          api.get('/parent/interests')
        ]);
        setChildren(childrenResponse.data);
        setAvailableInterests(interestsResponse.data);
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        setError('Could not load page data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // quick helper to refresh canonical list (ensures tier/is_active are current)
  const refreshChildren = async () => {
    try {
      const res = await api.get('/parent/my-children');
      setChildren(res.data);
    } catch (e) {
      // non-fatal; keep previous list if this fails
      console.warn('Refresh children failed:', e);
    }
  };

  // --- Handlers for clearing messages ---
  const clearMessages = () => {
    setError('');
    setSuccess('');
    setPasswordError('');
  };

  // ---------------------------
  // Helpers for UI state/status
  // ---------------------------
  const childIsDeactivated = (child) => {
    if (String(child.tier).toUpperCase() === 'DEACTIVATED') return true;
    if (child.is_active === false) return true;
    return false;
  };

  const renderStatusBadge = (child) => {
    if (!child.is_active || child.tier === 'DEACTIVATED') {
      return <span className="status-badge status-deactivated">DEACTIVATED</span>;
    }
    const plan = (child.tier || 'FREE').toUpperCase();
    return (
      <span className={`status-badge ${plan === 'PRO' ? 'status-pro' : 'status-free'}`}>
        ACTIVE – {plan}
      </span>
    );
  };

  // --- EVENT HANDLERS: Profile Editing ---
  const handleEditClick = (child) => {
    clearMessages();

    if (childIsDeactivated(child)) {
      setError('This child account is deactivated. Reactivate by upgrading to PRO.');
      return;
    }

    // Only keep editable fields to avoid accidentally PATCHing managed fields
    const base = {
      id: child.id, // keep for local state only (do not send)
      username: child.username || '',
      first_name: child.first_name || '',
      last_name: child.last_name || '',
      birthday: child.birthday || '',
      country: child.country || '',
      gender: child.gender || '',
      race: child.race || '',
      interests: (child.interests || []).map((i) => i.name),
      // custom fields for "Other"
      custom_country: '',
      custom_race: '',
    };

    setEditingChildId(child.id);
    setEditFormData(base);
  };

  const handleCancelClick = () => {
    setEditingChildId(null);
    setIsDropdownOpen(false);
  };

  // Input/select changes (incl. handling "Other" for country & race)
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;

    if (name === 'country') {
      setEditFormData((prev) => ({
        ...prev,
        country: value,
        custom_country: value === OTHER_VALUE ? prev.custom_country : ''
      }));
      return;
    }
    if (name === 'race') {
      setEditFormData((prev) => ({
        ...prev,
        race: value,
        custom_race: value === OTHER_VALUE ? prev.custom_race : ''
      }));
      return;
    }

    // Guard: only allow editing of whitelisted fields (plus custom_* helpers & id)
    if (
      EDITABLE_FIELDS.includes(name) ||
      name === 'custom_country' ||
      name === 'custom_race' ||
      name === 'id'
    ) {
      setEditFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditInterestsChange = (interestName) => {
    const current = editFormData.interests || [];
    const next = current.includes(interestName)
      ? current.filter((x) => x !== interestName)
      : [...current, interestName];
    setEditFormData((prev) => ({ ...prev, interests: next }));
  };

  // helper to merge saved patch into existing child (preserves tier/is_active)
  const mergeChildUpdate = (prevChildren, childId, patch) =>
    prevChildren.map((c) => (c.id === childId ? { ...c, ...patch } : c));

  const handleSaveClick = async () => {
    clearMessages();
    try {
      const childId = editFormData.id;

      // Build payload using only editable fields
      const payload = {
        username: editFormData.username?.trim() || null,
        first_name: editFormData.first_name?.trim() || null,
        last_name: editFormData.last_name?.trim() || null,
        birthday: editFormData.birthday || null,
        country: editFormData.country || null,
        gender: editFormData.gender || null,
        race: editFormData.race || null,
        interests: Array.isArray(editFormData.interests) ? editFormData.interests : [],
      };

      // Resolve “Other” for country/race
      if (editFormData.country === OTHER_VALUE) {
        payload.country = editFormData.custom_country?.trim() || null;
      }
      if (editFormData.race === OTHER_VALUE) {
        payload.race = editFormData.custom_race?.trim() || null;
      }

      const { data: saved } = await api.patch(`/parent/update-child/${childId}`, payload);

      // MERGE instead of replacing to keep server-only fields like tier/is_active
      setChildren((prev) => mergeChildUpdate(prev, childId, saved));

      setEditingChildId(null);
      setIsDropdownOpen(false);
      setSuccess('Profile updated successfully!');

      // Optional but recommended: refresh from server to ensure canonical state
      await refreshChildren();
    } catch (err) {
      console.error("Failed to update child:", err);
      setError("Failed to save changes. Please try again.");
    }
  };

  // --- EVENT HANDLERS: Deleting Account ---
  const handleDeleteClick = (child) => {
    clearMessages();
    setChildToDelete(child);
  };

  const handleConfirmDelete = async () => {
    if (!childToDelete) return;
    try {
      await api.delete(`/parent/delete-child/${childToDelete.id}`);
      setChildren(children.filter((c) => c.id !== childToDelete.id));
      setChildToDelete(null);
      setSuccess("Account deleted successfully.");
    } catch (err) {
      console.error("Failed to delete child account: ", err);
      setError("Failed to delete account. Please try again.");
      setChildToDelete(null);
    }
  };

  const handleCancelDelete = () => setChildToDelete(null);

  // --- EVENT HANDLERS: Changing Password ---
  const handlePasswordModalOpen = (child) => {
    clearMessages();
    if (childIsDeactivated(child)) {
      setError('This child account is deactivated. Reactivate by upgrading to PRO before changing password.');
      return;
    }
    setChildForPasswordChange(child);
  };

  const handlePasswordFormChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setPasswordError('');
  };
  
  const handleConfirmChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_new_password) {
      setPasswordError("New passwords do not match.");
      setPasswordData({ current_password: '', new_password: '', confirm_new_password: '' });
      return;
    }
    if (!passwordData.current_password || !passwordData.new_password) {
      setPasswordError("All password fields are required.");
      return;
    }

    try {
      const childId = childForPasswordChange.id;
      const dataToSend = {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      };
      await api.patch(`/parent/change-kid-password/${childId}`, dataToSend);
      setSuccess(`Password for ${childForPasswordChange.first_name} ${childForPasswordChange.last_name} has been changed successfully!`);
      handleCancelChangePassword();
    } catch (err) {
      console.error("Failed to change password:", err);
      const detail = err.response?.data?.detail || "An unexpected error occurred. Please try again.";
      setPasswordError(detail);
      setPasswordData({ current_password: '', new_password: '', confirm_new_password: '' });
    }
  };

  const handleCancelChangePassword = () => {
    setChildForPasswordChange(null);
    setPasswordData({ current_password: '', new_password: '', confirm_new_password: '' });
    setPasswordError('');
  };

  // --- RENDER LOGIC ---
  if (loading) return <div className="loading-state">Loading child accounts...</div>;

  return (
    <div className="page-container">
      <header className="page-header">
        <h2>View Child Accounts</h2>
      </header>
      
      {error && <p className="form-message error">{error}</p>}
      {success && <p className="form-message success">{success}</p>}

      <main>
        {children.length === 0 ? (
          <div className="no-children-message">
            <p>You have not created any child accounts yet.</p>
          </div>
        ) : (
          children.map((child) => {
            const isEditingThisChild = editingChildId === child.id;
            const isDeactivated = childIsDeactivated(child);

            return (
              <div key={child.id} className={`child-account-card ${isDeactivated ? 'card-deactivated' : ''}`}>
                <div className="child-card-header-row">
                  <h3 className="child-card-name">
                    {isEditingThisChild
                      ? 'Editing Profile'
                      : `${child.first_name || ''} ${child.last_name || ''}`.trim() || child.username}
                  </h3>
                  {renderStatusBadge(child)}
                </div>

                {isDeactivated && (
                  <div className="deactivated-note">
                    This account is currently deactivated. Your child cannot log in. Reactivate by upgrading to PRO.
                  </div>
                )}

                {isEditingThisChild ? (
                  /* --- EDITING VIEW --- */
                  <div className="profile-details editing">
                    <div className="form-group">
                      <label>Username</label>
                      <input type="text" name="username" value={editFormData.username || ''} onChange={handleEditFormChange} />
                    </div>

                    <div className="form-group">
                      <label>First Name</label>
                      <input type="text" name="first_name" value={editFormData.first_name || ''} onChange={handleEditFormChange} />
                    </div>

                    <div className="form-group">
                      <label>Last Name</label>
                      <input type="text" name="last_name" value={editFormData.last_name || ''} onChange={handleEditFormChange} />
                    </div>

                    <div className="form-group">
                      <label>Birthday</label>
                      <input type="date" name="birthday" value={editFormData.birthday || ''} onChange={handleEditFormChange} />
                    </div>

                    {/* Country SELECT + "Other" */}
                    <div className="form-group">
                      <label>Country</label>
                      <select name="country" value={editFormData.country || ''} onChange={handleEditFormChange}>
                        <option value="">Select country</option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c === 'Other' ? OTHER_VALUE : c}>{c}</option>
                        ))}
                      </select>
                      {editFormData.country === OTHER_VALUE && (
                        <input
                          type="text"
                          name="custom_country"
                          placeholder="Type country"
                          value={editFormData.custom_country || ''}
                          onChange={handleEditFormChange}
                          style={{ marginTop: 8 }}
                        />
                      )}
                    </div>

                    {/* Gender SELECT */}
                    <div className="form-group">
                      <label>Gender</label>
                      <select name="gender" value={editFormData.gender || ''} onChange={handleEditFormChange}>
                        <option value="">Select gender</option>
                        {GENDERS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    {/* Race SELECT + "Other" */}
                    <div className="form-group">
                      <label>Race</label>
                      <select name="race" value={editFormData.race || ''} onChange={handleEditFormChange}>
                        <option value="">Select race / ethnicity</option>
                        {RACES.map((r) => (
                          <option key={r} value={r === 'Other' ? OTHER_VALUE : r}>{r}</option>
                        ))}
                      </select>
                      {editFormData.race === OTHER_VALUE && (
                        <input
                          type="text"
                          name="custom_race"
                          placeholder="Type race / ethnicity"
                          value={editFormData.custom_race || ''}
                          onChange={handleEditFormChange}
                          style={{ marginTop: 8 }}
                        />
                      )}
                    </div>

                    <div className="form-group full-width">
                      <label>Interests</label>
                      <div className="custom-dropdown">
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen((prev) => !prev)}
                          className="dropdown-button"
                        >
                          {(editFormData.interests || []).length} selected
                          <span className="dropdown-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
                        </button>

                        {isDropdownOpen && (
                          <div className="dropdown-panel">
                            {availableInterests.map((interest) => (
                              <label key={interest.name} className="dropdown-item">
                                <input
                                  type="checkbox"
                                  checked={(editFormData.interests || []).includes(interest.name)}
                                  onChange={() => handleEditInterestsChange(interest.name)}
                                />
                                {interest.name}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* --- READ-ONLY VIEW --- */
                  <div className="profile-details">
                    <div className="form-group">
                      <label>Username</label>
                      <input type="text" value={child.username || 'N/A'} readOnly />
                    </div>
                    <div className="form-group">
                      <label>First Name</label>
                      <input type="text" value={child.first_name || 'N/A'} readOnly />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input type="text" value={child.last_name || 'N/A'} readOnly />
                    </div>
                    <div className="form-group">
                      <label>Birthday</label>
                      <input type="text" value={child.birthday || 'N/A'} readOnly />
                    </div>
                    <div className="form-group">
                      <label>Country</label>
                      <input type="text" value={child.country || 'N/A'} readOnly />
                    </div>
                    <div className="form-group">
                      <label>Gender</label>
                      <input type="text" value={child.gender || 'N/A'} readOnly />
                    </div>
                    <div className="form-group">
                      <label>Race</label>
                      <input type="text" value={child.race || 'N/A'} readOnly />
                    </div>
                    <div className="form-group full-width">
                      <label>Interests</label>
                      <div className="interests-display">
                        {child.interests && child.interests.length > 0
                          ? child.interests.map((i) => i.name).join(', ')
                          : 'No interests specified'}
                      </div>
                    </div>
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="action-buttons">
                  {isEditingThisChild ? (
                    <>
                      <button className="btn save-btn" onClick={handleSaveClick}>Save Changes</button>
                      <button className="btn cancel-btn" onClick={handleCancelClick}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button
                        className={`btn edit-btn ${isDeactivated ? 'btn-disabled' : ''}`}
                        onClick={() => handleEditClick(child)}
                        disabled={isDeactivated}
                      >
                        Edit Profile
                      </button>
                      <button
                        className={`btn password-btn ${isDeactivated ? 'btn-disabled' : ''}`}
                        onClick={() => handlePasswordModalOpen(child)}
                        disabled={isDeactivated}
                      >
                        Change Password
                      </button>
                      <button className="btn delete-btn" onClick={() => handleDeleteClick(child)}>Delete Account</button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* DELETE MODAL */}
      {childToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Deletion</h3>
            <p>
              Are you sure you want to permanently delete the account for <strong>{childToDelete.username}</strong>?
            </p>
            <div className="modal-actions">
              <button className="btn cancel-btn" onClick={handleCancelDelete}>Cancel</button>
              <button className="btn delete-btn-confirm" onClick={handleConfirmDelete}>Delete Account</button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {childForPasswordChange && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Change Password</h3>
            <p>
              Changing password for <strong>{childForPasswordChange.username}</strong>.
            </p>

            <form
              onSubmit={(e) => { e.preventDefault(); handleConfirmChangePassword(); }}
              className="modal-form"
            >
              <div className="form-group">
                <label htmlFor="current_password">Current Password</label>
                <input
                  type="password"
                  id="current_password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new_password">New Password</label>
                <input
                  type="password"
                  id="new_password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm_new_password">Confirm New Password</label>
                <input
                  type="password"
                  id="confirm_new_password"
                  name="confirm_new_password"
                  value={passwordData.confirm_new_password}
                  onChange={handlePasswordFormChange}
                  required
                />
              </div>

              {passwordError && <p className="form-message error">{passwordError}</p>}

              <div className="modal-actions">
                <button type="button" className="btn cancel-btn" onClick={handleCancelChangePassword}>Cancel</button>
                <button type="submit" className="btn save-btn">Save Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewChildAccounts;
