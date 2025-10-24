// ChildSearchFavorite.jsx
import React, { useState, useEffect } from "react";
import "../styles/ChildrenDashboard.css";
import api from "../api/axiosConfig";

export default function ChildSearchFavorite({ userId, onClose, refreshFavorites }) {
  const [favorites, setFavorites] = useState([]);
  const [filteredFavorites, setFilteredFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // For delete popup
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function fetchFavorites() {
    if (!userId) return;
    try {
      const res = await api.get(`/favorite/${userId}`);
      const normalized = res.data.map((f) => ({
        ...f,
        type: f.type.toLowerCase(),
      }));
      setFavorites(normalized);
      setFilteredFavorites(normalized);
    } catch (err) {
      console.error("fetchFavorites:", err.response || err);
    }
  }

  useEffect(() => {
    fetchFavorites();
  }, [userId]);

  // Instead of deleting immediately, show popup
  function handleDeleteClick(fav) {
    setDeleteTarget(fav);
    setShowConfirm(true);
  }

  // Confirm delete
  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/favorite/${userId}/${deleteTarget.type}/${deleteTarget.id}`);
      setFavorites((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setFilteredFavorites((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      if (refreshFavorites) refreshFavorites();
    } catch (err) {
      console.error("deleteFavorite:", err.response || err);
      alert("Could not delete favorite.");
    } finally {
      setShowConfirm(false);
      setDeleteTarget(null);
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
      {/* Header */}
      <div
        className="child-dashboard__modal-header"
        style={{ position: "relative", textAlign: "center" }}
      >
        <button
          className="child-dashboard__btn child-dashboard__btn--outline"
          onClick={onClose}
          style={{
            position: "absolute",
            left: "10px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          ← Close
        </button>
        <h2 style={{ margin: 0, fontSize: "2.5rem", fontWeight: "bold" }}>
          Favorites ❤️
        </h2>
      </div>

      {/* Search bar */}
      <div className="child-dashboard__favorites-search">
        <input
          type="text"
          placeholder="Search favorites..."
          value={searchTerm}
          onChange={handleSearch}
          className="child-dashboard__search"
        />
      </div>

      {/* Favorites list */}
      <div className="child-dashboard__favorites-list expanded">
        {filteredFavorites.length === 0 && (
          <div className="child-dashboard__fav-empty">No favorites found</div>
        )}
        {filteredFavorites.map((f) => (
          <div
            key={f.id}
            className="child-dashboard__fav-row"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              padding: "8px 0",
              flexWrap: "wrap",
            }}
          >
            <div
              className="child-dashboard__fav-info"
              style={{
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <span
                className="child-dashboard__fav-type"
                style={{ marginRight: "10px" }}
              >
                {f.type === "book" ? "📚 Book" : "🎬 Video"}
              </span>
              <a
                className="child-dashboard__fav-title"
                href={f.link || "#"}
                target="_blank"
                rel="noreferrer"
                style={{
                  textDecoration: "none",
                  color: "#0077cc",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "wrap",
                  display: "inline-block",
                  maxWidth: "90%",
                  verticalAlign: "middle",
                }}
              >
                {f.title}
              </a>
            </div>
            <button
              className="child-dashboard__fav-del"
              onClick={() => handleDeleteClick(f)}
              style={{
                background: "#ff4d4f",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* ✅ Custom confirmation popup */}
      {showConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "30px",
              borderRadius: "12px",
              textAlign: "center",
              width: "300px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
            }}
          >
            <h3 style={{ marginBottom: "15px" }}>Remove Favorite?</h3>
            <p style={{ fontSize: "0.95rem", marginBottom: "25px" }}>
              Are you sure you want to remove{" "}
              <strong>
                {deleteTarget?.title?.length > 30
                  ? deleteTarget.title.slice(0, 30) + "..."
                  : deleteTarget?.title}
              </strong>
              ?
            </p>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <button
                onClick={confirmDelete}
                style={{
                  background: "#ff4d4f",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 14px",
                  cursor: "pointer",
                }}
              >
                Yes
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  background: "#ccc",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 14px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
