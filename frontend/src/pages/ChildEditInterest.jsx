// ChildEditInterest.jsx
import React, { useState, useEffect } from "react";
import "../styles/ChildrenDashboard.css";
import api from "../api/axiosConfig";

export default function ChildEditInterest({ userId, onClose, onSaved = null }) {
  const [availableInterests, setAvailableInterests] = useState([]);
  const [userInterests, setUserInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // --- Fetch all interests and child's current interests ---
  useEffect(() => {
    let cancelled = false;

    async function loadInterests() {
      setLoading(true);
      try {
        // 1️⃣ Fetch all available interests from DB
        const availResp = await api.get("/parent/interests");
        if (cancelled) return;
        const avail = availResp?.data ?? [];
        // Map Enum values to string
        const availStr = avail.map(i => ({ id: i.id, name: i.name }));
        setAvailableInterests(availStr);

        // 2️⃣ Fetch child's current interests
        const childResp = await api.get(`/child/${userId}/interests`);
        if (cancelled) return;
        const current = childResp?.data?.map(i => {
  // If the backend returns "InterestsList.ART", take only "ART"
  const parts = i.name.split(".");
  return parts[parts.length - 1];
}) || [];
setUserInterests(current);

      } catch (err) {
        console.error("Failed to load interests:", err);
        setError("Could not load interests. Please try again later.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInterests();
    return () => { cancelled = true; };
  }, [userId]);

  // --- Toggle interest selection ---
  function toggleInterest(name) {
    setUserInterests(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  }

  // --- Save updated interests to backend ---
  async function saveUserInterests() {
    setSaving(true);
    setError("");
    try {
      const payload = { interests: userInterests }; // array of names
      const res = await api.put(`/child/${userId}/interests`, payload);
      alert(res.data?.message || "✅ Interests updated successfully!");
      if (typeof onSaved === "function") onSaved(userInterests);
      onClose();
    } catch (err) {
      console.error("Failed to save interests:", err);
      const serverMsg = err?.response?.data?.message || err?.response?.data?.detail || err?.message;
      setError(serverMsg || "Failed to save interests. Please try again later.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="child-dashboard__modal-overlay" onClick={onClose}>
        <div className="child-dashboard__modal" onClick={e => e.stopPropagation()}>
          <h3>Loading Interests...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="child-dashboard__modal-overlay" onClick={onClose}>
      <div className="child-dashboard__modal" onClick={e => e.stopPropagation()}>
        <h3>Edit Interests</h3>
        <p className="child-dashboard__hint">Select the topics you’re most interested in:</p>

        {error && <p className="message error" style={{ marginBottom: 12 }}>{error}</p>}

        <div className="child-dashboard__interest-list" style={{ maxHeight: 320, overflowY: "auto" }}>
          {availableInterests.map((interest) => {
  // Use only the last part after '.' if it's an Enum
  const interestName = interest.name.includes(".")
    ? interest.name.split(".").pop()
    : interest.name;

  const checked = userInterests.includes(interestName);
  return (
    <label key={interest.id} className="child-dashboard__interest-item">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => toggleInterest(interestName)}
      />
      <span>{interestName}</span>
    </label>
  );
})}

        </div>

        <div className="child-dashboard__modal-actions">
          <button
            className="child-dashboard__btn child-dashboard__btn--primary"
            onClick={saveUserInterests}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            className="child-dashboard__btn child-dashboard__btn--outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
