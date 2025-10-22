import React, { useState, useEffect } from "react";
import '../styles/ChildrenDashboard.css';

export default function ChildSearchFavorite({ userId }) {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    fetchFavorites();
  }, []);

  async function fetchFavorites() {
    try {
      const res = await fetch(`/api/user/${userId}/favorites`);
      if (!res.ok) throw new Error("Failed to fetch favorites");
      setFavorites(await res.json());
    } catch (err) {
      console.error("fetchFavorites:", err);
    }
  }

  async function deleteFavorite(favId) {
    if (!window.confirm("Delete this favorite?")) return;
    try {
      const res = await fetch(`/api/user/${userId}/favorites/${favId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setFavorites(prev => prev.filter(f => f.id !== favId));
    } catch (err) {
      console.error("deleteFavorite:", err);
      alert("Could not delete favorite.");
    }
  }

  return (
    <div className="child-dashboard__favorites-list expanded">
      {favorites.length === 0 && <div className="child-dashboard__fav-empty">No favorites</div>}
      {favorites.map(f => (
        <div key={f.id} className="child-dashboard__fav-row">
          <a className="child-dashboard__fav-title" href={f.link || "#"} target="_blank" rel="noreferrer">{f.title}</a>
          <button className="child-dashboard__fav-del" onClick={() => deleteFavorite(f.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
