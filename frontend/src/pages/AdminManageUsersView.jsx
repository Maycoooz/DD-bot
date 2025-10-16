import '../styles/AdminManageUsersView.css';
import ConfirmationModal from './ConfirmationModal';
import React, { useState } from 'react';

function AdminManageUsersView({ user, allUsers, onClose, onDeleteUser }) {

    const isParent = user.role.name === 'PARENT';
    const parent = !isParent ? allUsers.find(u => u.id === user.primary_parent_id) : null;
    const children = isParent ? allUsers.filter(u => u.primary_parent_id === user.id) : [];
    
    // State to show/hide the confirmation modal
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    // This function will open the confirmation modal
    const handleDeleteClick = () => {
        setIsConfirmingDelete(true);
    };

    // This function is called when the user confirms the deletion
    const handleConfirmDelete = () => {
        onDeleteUser(user);
        setIsConfirmingDelete(false); 
    };

    return (
        <>
            <div className="modal-overlay">
                <div className="user-detail-modal">
                    <div className="modal-header">
                        <button onClick={onClose} className="btn-back">Back</button>
                        <h3>View User ({user.role.name})</h3>
                        <span>Status: {user.is_verified ? 'Active' : 'Pending'}</span>
                    </div>

                    <div className="modal-body">
                        <div className="detail-grid">
                            <div className="detail-item"><label>Username</label><input type="text" value={user.username} readOnly /></div>
                            {isParent ? (
                                 <div className="detail-item"><label>Email</label><input type="text" value={user.email || 'N/A'} readOnly /></div>
                            ) : (
                                 <div className="detail-item"><label>Parent Username</label><input type="text" value={parent?.username || 'N/A'} readOnly /></div>
                            )}
                            <div className="detail-item"><label>First Name</label><input type="text" value={user.first_name} readOnly /></div>
                            <div className="detail-item"><label>Last Name</label><input type="text" value={user.last_name} readOnly /></div>
                            <div className="detail-item"><label>Role</label><input type="text" value={user.role.name} readOnly /></div>
                            <div className="detail-item"><label>Tier</label><input type="text" value={isParent ? user.tier : parent?.tier || 'N/A'} readOnly /></div>
                        </div>

                        {isParent && children.length > 0 && (
                            <div className="child-accounts-section">
                                <h4>Kid Accounts</h4>
                                <div className="child-accounts-list">
                                    {children.map(child => (
                                        <div key={child.id} className="child-account-item">{child.username}</div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        {isParent && <p className="warning-text">Warning! Deleting a parent account also deletes all related kids' accounts.</p>}
                        <button onClick={handleDeleteClick} className="btn-ban">Delete Account</button>
                    </div>
                </div>
            </div>

            {isConfirmingDelete && (
                <ConfirmationModal
                    message={`Are you sure you want to permanently delete the account for '${user.username}'?`}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setIsConfirmingDelete(false)}
                />
            )}
        </>
    );
}

export default AdminManageUsersView;