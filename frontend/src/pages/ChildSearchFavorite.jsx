// ChildSearchFavorite.jsx
import React, { useState, useEffect } from "react";
import "../styles/ChildrenDashboard.css";

export default function ChildSearchFavorite({ userId, onClose }) {
  const [favorites, setFavorites] = useState([]);
  const [filteredFavorites, setFilteredFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchFavorites();
  }, []);

  async function fetchFavorites() {
    try {
      const res = await fetch(`/api/user/${userId}/favorites`);
      if (!res.ok) throw new Error("Failed to fetch favorites");
      const data = await res.json();
      setFavorites(data);
      setFilteredFavorites(data);
    } catch (err) {
      console.error("fetchFavorites:", err);
    }
  }

  async function deleteFavorite(favId) {
    if (!window.confirm("Remove this favorite?")) return;
    try {
      const res = await fetch(`/api/user/${userId}/favorites/${favId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      const updated = favorites.filter((f) => f.id !== favId);
      setFavorites(updated);
      setFilteredFavorites(updated);
    } catch (err) {
      console.error("deleteFavorite:", err);
      alert("Could not delete favorite.");
    }
  }

  function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    setSearchTerm(query);
    setFilteredFavorites(
      favorites.filter((f) => f.title.toLowerCase().includes(query))
    );
  }

  return (
    <div
      className="child-dashboard__modal child-dashboard__modal--wide"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with Close Button and Center Title */}
      <div className="child-dashboard__modal-header" style={{ position: "relative", textAlign: "center" }}>
        <button
          className="child-dashboard__btn child-dashboard__btn--outline"
          onClick={onClose}
          style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
        >
          ← Close
        </button>
        <h2 style={{ margin: 0, fontSize: "2.5rem", fontWeight: "bold" }}>Favorite</h2>
      </div>

      {/* Search Bar */}
      <div className="child-dashboard__favorites-search">
        <input
          type="text"
          placeholder="Search favorites..."
          value={searchTerm}
          onChange={handleSearch}
          className="child-dashboard__search"
        />
      </div>

      {/* Favorites List */}
      <div className="child-dashboard__favorites-list expanded">
        {filteredFavorites.length === 0 && (
          <div className="child-dashboard__fav-empty">No favorites found</div>
        )}
        {filteredFavorites.map((f) => (
          <div key={f.id} className="child-dashboard__fav-row">
            <div className="child-dashboard__fav-info">
              <span className="child-dashboard__fav-type">
                {f.type === "book" ? "📚 Book" : "🎬 Video"}
              </span>
              <a
                className="child-dashboard__fav-title"
                href={f.link || "#"}
                target="_blank"
                rel="noreferrer"
              >
                {f.title}
              </a>
            </div>
            <button
              className="child-dashboard__fav-del"
              onClick={() => deleteFavorite(f.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
