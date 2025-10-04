// frontend/src/pages/ParentDashboard.jsx
import React from 'react';

function ParentDashboard() {
    // You would load the user profile from localStorage here to display data
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');

    return (
        <div>
            <h1>Welcome, Parent {profile.first_name} 👋</h1>
            <p>Role: {localStorage.getItem('userRole')}</p>
            {/* Logic to display children and parent tools goes here */}
        </div>
    );
}

export default ParentDashboard;