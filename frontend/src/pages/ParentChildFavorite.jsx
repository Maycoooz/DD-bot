import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import '../styles/ParentChildFavorite.css';

function ParentChildFavorites({ parentId }) {
    const [childrenList, setChildrenList] = useState([]);
    const [selectedChildId, setSelectedChildId] = useState('');
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch the children for this parent
    useEffect(() => {
        const fetchChildren = async () => {
            try {
                const res = await api.get('/parent/my-children');
                setChildrenList(res.data);
                if (res.data.length > 0) setSelectedChildId(res.data[0].id);
            } catch (err) {
                console.error(err);
                setError('Failed to load children.');
            }
        };
        fetchChildren();
    }, []);

    // Fetch favorites for the selected child
    useEffect(() => {
        if (!selectedChildId) return;
        const fetchFavorites = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/favorite/${selectedChildId}`);
                setFavorites(Array.isArray(res.data) ? res.data : []);
                setError('');
            } catch (err) {
                console.error(err);
                setFavorites([]);
                setError('Failed to load favorites.');
            } finally {
                setLoading(false);
            }
        };
        fetchFavorites();
    }, [selectedChildId]);

    if (childrenList.length === 0) return <p>No children found.</p>;

    return (
        <div className="child-favorites-dashboard">
            <h2>Child Favorites</h2>
            <div style={{ marginBottom: '10px' }}>
                <label>Select Child: </label>
                <select
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(Number(e.target.value))}
                >
                    {childrenList.map(child => (
                        <option key={child.id} value={child.id}>
                            {child.first_name} {child.last_name}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
    <p>Loading favorites...</p>
) : error ? (
    <p style={{ color: 'red' }}>{error}</p>
) : Array.isArray(favorites) && favorites.length > 0 ? (
    <ul>
        {favorites.map(f => (
            <li key={f.id}>
                {f.type?.toLowerCase() === "book" ? "📚 Book : " : "🎬 Video : "}
                {f.title}
            </li>
        ))}
    </ul>
) : (
    <p>No favorites found for this child.</p>
)}
        </div>
    );
}

export default ParentChildFavorites;
