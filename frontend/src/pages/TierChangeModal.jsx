// TierChangeModal.jsx (you can keep it inline in ParentProfile.jsx if you want)
import React from 'react';

function TierChangeModal({
    isOpen,
    onClose,
    previewData,
    isSubmitting,
    selectedKeepChildId,
    setSelectedKeepChildId,
    onConfirm,
}) {
    if (!isOpen || !previewData) return null;

    const {
        current_tier,
        target_tier,
        gain_features = [],
        lose_features = [],
        requires_child_choice = false,
        children = [],
        max_children_allowed,
    } = previewData;

    const headingText =
        target_tier === 'PRO'
            ? 'Upgrade to Pro'
            : 'Switch to Free';

    const confirmButtonText =
        target_tier === 'PRO'
            ? 'Confirm Upgrade'
            : 'Confirm Downgrade';

    const confirmDisabled =
        isSubmitting ||
        (requires_child_choice && !selectedKeepChildId);

    return (
        <div className="tier-modal-overlay">
            <div className="tier-modal-card">
                {/* Header */}
                <div className="tier-modal-header">
                    <h2>{headingText}</h2>
                    <button
                        className="tier-modal-close-btn"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className="tier-modal-body">
                    <p className="tier-summary-line">
                        You are currently on <strong>{current_tier}</strong>. You are
                        requesting <strong>{target_tier}</strong>.
                    </p>

                    {/* Upgrade gains */}
                    {gain_features.length > 0 && (
                        <div className="tier-section">
                            <h3 className="tier-section-title positive-title">
                                You will gain:
                            </h3>
                            <ul className="tier-feature-list">
                                {gain_features.map((feat, idx) => (
                                    <li key={idx} className="tier-feature-item gain">
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Downgrade losses */}
                    {lose_features.length > 0 && (
                        <div className="tier-section">
                            <h3 className="tier-section-title negative-title">
                                You will lose:
                            </h3>
                            <ul className="tier-feature-list">
                                {lose_features.map((feat, idx) => (
                                    <li key={idx} className="tier-feature-item lose">
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Child choice requirement on downgrade */}
                    {requires_child_choice && (
                        <div className="tier-section child-choice-block">
                            <h3 className="tier-section-title warning-title">
                                Child Account Limit
                            </h3>
                            <p className="downgrade-warning">
                                The FREE plan allows only {max_children_allowed}{' '}
                                active child account.
                                You currently have more than that. Please choose{' '}
                                <strong>which child account to keep active</strong>.
                                All other child accounts will be{' '}
                                <strong>deactivated</strong>.
                            </p>

                            <div className="child-choice-list">
                                {children.map((kid) => (
                                    <label
                                        key={kid.id}
                                        className={`child-choice-row ${
                                            String(selectedKeepChildId) ===
                                            String(kid.id)
                                                ? 'child-choice-selected'
                                                : ''
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="keepChild"
                                            value={kid.id}
                                            checked={
                                                String(selectedKeepChildId) ===
                                                String(kid.id)
                                            }
                                            onChange={() =>
                                                setSelectedKeepChildId(kid.id)
                                            }
                                            disabled={isSubmitting}
                                        />
                                        <div className="child-choice-info">
                                            <div className="child-choice-username">
                                                {kid.username}
                                            </div>
                                            <div className="child-choice-name">
                                                {[
                                                    kid.first_name || '',
                                                    kid.last_name || '',
                                                ]
                                                    .join(' ')
                                                    .trim() || '(no name)'}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="tier-modal-footer">
                    <button
                        className="tier-cancel-btn"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>

                    <button
                        className="tier-confirm-btn"
                        onClick={onConfirm}
                        disabled={confirmDisabled}
                    >
                        {isSubmitting ? 'Saving...' : confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TierChangeModal;
