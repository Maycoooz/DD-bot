import React from 'react';

function LibrarianDashboard() {
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');

    return (
        <div>
            <h1>Welcome {profile.first_name}!</h1>
            <p>Role: {localStorage.getItem('userRole')}</p>
            {/* Logic for the librarian's interface goes here */}
        </div>
    );
}

export default LibrarianDashboard;
