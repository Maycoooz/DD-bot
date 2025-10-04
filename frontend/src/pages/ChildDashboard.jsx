// frontend/src/pages/ChildDashboard.jsx
import React from 'react';

function ChildDashboard() {
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');

    return (
        <div>
            <h1>Welcome, Child {profile.first_name}! 🧸</h1>
            <p>Role: {localStorage.getItem('userRole')}</p>
            {/* Logic for the child's interface goes here */}
        </div>
    );
}

export default ChildDashboard;
