import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/ParentProfile.css';
import ChangePasswordModal from './ChangePasswordModal';
import TierChangeModal from './TierChangeModal'; 

function ParentProfile({ onProfileUpdate }) {
    // pull from localStorage first just for instant paint
    const initialProfile = JSON.parse(
        localStorage.getItem('userProfile') || '{}'
    );
    const [profileData, setProfileData] = useState(initialProfile);

    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // tier modal state
    const [showTierModal, setShowTierModal] = useState(false);
    const [tierPreview, setTierPreview] = useState(null);
    const [isTierSubmitting, setIsTierSubmitting] = useState(false);
    const [selectedKeepChildId, setSelectedKeepChildId] = useState(null);

    // Is parent if there is no primary_parent_id
    const isParent = !profileData?.primary_parent_id;

    // fields required for profile save
    const requiredForParent = [
        'first_name',
        'last_name',
        'country',
        'gender',
        'birthday',
        'race',
    ];

    // Fetch parent profile fresh from backend (/parent/me)
    const fetchLatestProfile = async () => {
        try {
            const response = await api.get('/parent/me');
            const latestProfile = response.data;
            setProfileData(latestProfile);
            localStorage.setItem(
                'userProfile',
                JSON.stringify(latestProfile)
            );
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
        setProfileData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    // Save profile updates (name, birthday, etc.) via /users/me/
    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('');

        const excludedFields = [
            'id',
            'username',
            'email',
            'role',
            'role_name',
            'tier',
            'hashed_password',
            'primary_parent_id',
            'children',
        ];

        const dataToSend = {};

        // validate required fields
        const missing = requiredForParent.filter(
            (key) =>
                !profileData[key] ||
                profileData[key].toString().trim() === ''
        );
        if (missing.length > 0) {
            setMessage(
                `Error: The following fields are required: ${missing.join(
                    ', '
                )}.`
            );
            return;
        }

        for (const key in profileData) {
            if (excludedFields.includes(key)) continue;
            let value = profileData[key];
            if (!value || value.toString().trim() === '') {
                value = null;
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
            if (onProfileUpdate) {
                onProfileUpdate(profileData);
            }
        } catch (err) {
            let detail =
                err.response?.data?.detail || 'Update failed.';
            if (Array.isArray(err.response?.data?.detail)) {
                detail =
                    'Server Validation Error: ' +
                    err.response.data.detail
                        .map(
                            (e) =>
                                `${e.loc[e.loc.length - 1]} (${e.msg})`
                        )
                        .join('; ');
            }
            setMessage(`Error: ${detail}`);
            console.error('Update error:', err.response || err);
        }
    };

    // ------------------------
    // Tier change flow
    // ------------------------

    // 1. Open modal and fetch preview from /parent/tier-preview
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

            // backend returns:
            // {
            //   current_tier: "PRO",
            //   target_tier: "FREE",
            //   gain_features: [...],
            //   lose_features: [...],
            //   requires_child_choice: true/false,
            //   children: [{id,...}, ...],
            //   max_children_allowed: 1
            // }
            setTierPreview(res.data || null);
        } catch (err) {
            console.error('Failed to load tier preview:', err);
            const fallback = {
                current_tier: currentTier,
                target_tier: targetTier,
                gain_features: [],
                lose_features: [],
                requires_child_choice: false,
                children: [],
                max_children_allowed: 1,
            };

            // Show a rough message if it fails
            setTierPreview(fallback);
            setMessage(
                err.response?.data?.detail ||
                    'Error loading upgrade/downgrade info.'
            );
        }
    };

    // 2. Confirm tier change (PATCH /parent/change-tier)
    const handleConfirmTierChange = async () => {
        if (!tierPreview) return;
        setIsTierSubmitting(true);
        setMessage('');

        try {
            const body = {
                target_tier: tierPreview.target_tier,
                // Only send keep_child_id if required AND the parent chose one
                keep_child_id:
                    tierPreview.requires_child_choice &&
                    selectedKeepChildId
                        ? selectedKeepChildId
                        : undefined,
            };

            const res = await api.patch('/parent/change-tier', body);

            // Backend returns the updated parent profile (same shape as /parent/me)
            const updatedProfile = res.data;
            setProfileData(updatedProfile);
            localStorage.setItem(
                'userProfile',
                JSON.stringify(updatedProfile)
            );

            // close modal + reset state
            setShowTierModal(false);
            setTierPreview(null);
            setSelectedKeepChildId(null);
            setIsTierSubmitting(false);

            setMessage(
                `Subscription tier updated to ${
                    updatedProfile.tier || 'FREE'
                } successfully.`
            );

            if (onProfileUpdate) {
                onProfileUpdate(updatedProfile);
            }
        } catch (err) {
            console.error('Tier change failed:', err);

            const statusCode = err.response?.status;
            const detail = err.response?.data?.detail;

            // SPECIAL CASE:
            // Backend said "Multiple child accounts. Please choose which child to keep active."
            // -> Keep the modal open, force-show the child picker, and block confirm until they pick.
            if (
                statusCode === 400 &&
                typeof detail === 'string' &&
                detail.toLowerCase().includes('multiple child')
            ) {
                // Tell the user what's wrong
                setMessage(`Error: ${detail}`);

                // Force the modal to show the radio list:
                // - We already have tierPreview.children from /parent/tier-preview
                // - We just flip requires_child_choice to true so the modal renders the picker
                setTierPreview((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        requires_child_choice: true,
                    };
                });

                // Keep the modal open, allow them to pick a child now
                setIsTierSubmitting(false);
                return;
            }

            // All other errors -> close modal and show message
            const fallbackDetail =
                detail || 'Failed to change subscription tier.';
            setMessage(`Error: ${fallbackDetail}`);

            setIsTierSubmitting(false);
        }
    };

    // ------------------------
    // Render helpers
    // ------------------------

    const renderField = (label, key) => {
        const isRequired = requiredForParent.includes(key);
        const value = profileData[key] || '';
        const inputType = key === 'birthday' ? 'date' : 'text';

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
                        placeholder={
                            value === '' && !isRequired
                                ? 'Not provided'
                                : undefined
                        }
                    />
                ) : (
                    <span className="profile-value">
                        {value || 'Not provided'}
                    </span>
                )}
            </div>
        );
    };

    // Subscription Tier row with Upgrade/Downgrade button
    const renderTierRow = () => {
        const currentTier = profileData.tier || 'FREE';
        const buttonText =
            currentTier === 'PRO'
                ? 'Switch to Free'
                : 'Upgrade to Pro';

        return (
            <div
                className="profile-field subscription-tier-row"
                key="subscription_tier_row"
            >
                <label>SUBSCRIPTION TIER:</label>

                <div className="subscription-tier-value-row">
                    <span className="profile-value tier-inline">
                        {currentTier}
                    </span>

                    {!isEditing && isParent && (
                        <button
                            type="button"
                            className={
                                currentTier === 'PRO'
                                    ? 'btn-downgrade'
                                    : 'btn-upgrade'
                            }
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
                <p
                    className={`message ${
                        message.startsWith('Error')
                            ? 'error'
                            : 'success'
                    }`}
                >
                    {message}
                </p>
            )}

            <div className="profile-actions">
                {isEditing ? (
                    <button
                        onClick={handleUpdate}
                        className="btn-primary"
                        type="button"
                    >
                        Save Profile
                    </button>
                ) : (
                    <>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="btn-primary"
                            type="button"
                        >
                            Edit Profile
                        </button>
                        <button
                            onClick={() =>
                                setShowPasswordModal(true)
                            }
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
                onSubmit={
                    isEditing
                        ? handleUpdate
                        : (e) => e.preventDefault()
                }
                className="profile-grid"
            >
                {renderField('USERNAME', 'username')}
                {renderField('EMAIL', 'email')}
                {renderField('FIRST NAME', 'first_name')}
                {renderField('LAST NAME', 'last_name')}
                {renderField('COUNTRY', 'country')}
                {renderField('GENDER', 'gender')}
                {renderField('BIRTHDAY', 'birthday')}
                {renderField('RACE', 'race')}

                {renderTierRow()}
            </form>

            {showPasswordModal && profileData.id && (
                <ChangePasswordModal
                    userId={profileData.id}
                    username={profileData.username}
                    onClose={() => setShowPasswordModal(false)}
                />
            )}

            {/* Tier Change Modal */}
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
