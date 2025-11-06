// TierChangeModal.jsx
import React, { useState } from 'react';
import '../styles/TierChangeModal.css'; // ⬅️ new CSS file

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

  const isUpgrade = target_tier === 'PRO';

  const headingText = isUpgrade ? 'Upgrade to Pro' : 'Switch to Free';
  const confirmButtonText = isUpgrade ? 'Confirm Upgrade' : 'Confirm Downgrade';

  // --- Local state for fake payment details (upgrade only) ---
  const [cardNumber, setCardNumber] = useState(''); // digits only
  const [cardCvv, setCardCvv] = useState('');       // 3 digits
  const [cardExpiry, setCardExpiry] = useState(''); // MM/YY
  const [cardError, setCardError] = useState('');

  // ---- Input handlers enforcing formats ----
  const handleCardNumberChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
    setCardNumber(digits);
    setCardError('');
  };

  const handleCardCvvChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 3);
    setCardCvv(digits);
    setCardError('');
  };

  const handleCardExpiryChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    let formatted = raw;
    if (raw.length >= 3) {
      formatted = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setCardExpiry(formatted);
    setCardError('');
  };

  const validateCard = () => {
    if (!isUpgrade) return true;

    if (cardNumber.length !== 16) {
      setCardError('Please enter a valid 16-digit card number.');
      return false;
    }

    if (!/^\d{3}$/.test(cardCvv)) {
      setCardError('Please enter a valid 3-digit CVV.');
      return false;
    }

    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      setCardError('Please enter expiry in MM/YY format.');
      return false;
    }

    const month = parseInt(cardExpiry.slice(0, 2), 10);
    const year2 = parseInt(cardExpiry.slice(3), 10);

    if (Number.isNaN(month) || Number.isNaN(year2) || month < 1 || month > 12) {
      setCardError('Please enter a valid expiry month and year.');
      return false;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const century = Math.floor(currentYear / 100) * 100;
    const fullYear = century + year2;

    const thisMonth = new Date(currentYear, now.getMonth(), 1);
    const expMonth = new Date(fullYear, month - 1, 1);

    if (expMonth < thisMonth) {
      setCardError('Expiry date cannot be in the past.');
      return false;
    }

    setCardError('');
    return true;
  };

  const confirmDisabled =
    isSubmitting ||
    (requires_child_choice && !selectedKeepChildId) ||
    (isUpgrade &&
      (cardNumber.length !== 16 ||
        cardCvv.length !== 3 ||
        cardExpiry.length !== 5)); // MM/YY

  const handleConfirmClick = () => {
    if (isUpgrade && !validateCard()) return;
    onConfirm();
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setCardNumber('');
    setCardCvv('');
    setCardExpiry('');
    setCardError('');
    onClose();
  };

  return (
    <div className="tier-modal-overlay">
      <div className="tier-modal-card">
        {/* Header */}
        <div className="tier-modal-header">
          <h2>{headingText}</h2>
          <button
            className="tier-modal-close-btn"
            onClick={handleClose}
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

          {/* Payment details for upgrade */}
          {isUpgrade && (
            <div className="tier-section tier-payment-section">
              <h3 className="tier-section-title warning-title">
                Payment details
              </h3>
              <p className="tier-summary-line">
                Please enter your card details to complete the upgrade.
              </p>

              <div className="tier-card-grid">
                <div className="tier-card-field tier-card-field-wide">
                  <label>Card Number</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="16-digit card number"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="tier-card-field">
                  <label>CVV</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={3}
                    placeholder="3 digits"
                    value={cardCvv}
                    onChange={handleCardCvvChange}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="tier-card-field">
                  <label>Expiry (MM/YY)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={handleCardExpiryChange}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {cardError && (
                <p className="tier-card-error">{cardError}</p>
              )}
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
                      String(selectedKeepChildId) === String(kid.id)
                        ? 'child-choice-selected'
                        : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="keepChild"
                      value={kid.id}
                      checked={String(selectedKeepChildId) === String(kid.id)}
                      onChange={() => setSelectedKeepChildId(kid.id)}
                      disabled={isSubmitting}
                    />
                    <div className="child-choice-info">
                      <div className="child-choice-username">
                        {kid.username}
                      </div>
                      <div className="child-choice-name">
                        {[kid.first_name || '', kid.last_name || '']
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
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            className="tier-confirm-btn"
            onClick={handleConfirmClick}
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
