import React from 'react';
import '../styles/ConfirmationModal.css'; // We will create this CSS file next

function ConfirmationModal({ message, onConfirm, onCancel }) {
    return (
        <div className="modal-overlay">
            <div className="confirmation-modal">
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    <button onClick={onCancel} className="btn-cancel">Cancel</button>
                    <button onClick={onConfirm} className="btn-confirm">Confirm</button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationModal;