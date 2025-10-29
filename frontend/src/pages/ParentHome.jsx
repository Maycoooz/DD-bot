import React from 'react';
import ParentChildStatistics from './ParentChildStatistics';

function ParentHome({ parentId }) {
    return (
        <div className="parent-home">
            <h2>Welcome to Your Parent Dashboard</h2>
            <p>
                This is your central hub for managing child accounts and viewing activity.
                <br /><br />
                — Summary stats and recent activity will appear here —
                <br />
            </p>

            {/* Add spacing and show child statistics */}
            <div style={{ marginTop: '40px' }}>
                <ParentChildStatistics parentId={parentId} />
            </div>
        </div>
    );
}

export default ParentHome;
