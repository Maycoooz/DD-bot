import React from "react";
import "../styles/ChildrenDashboard.css";

export default function SuccessPopup({ message, onClose }) {
  return (
    <div className="success-popup-overlay" onClick={onClose}>
      <div className="success-popup" onClick={(e) => e.stopPropagation()}>
        <p>{message}</p>
        <button
          className="child-dashboard__btn child-dashboard__btn--outline"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
