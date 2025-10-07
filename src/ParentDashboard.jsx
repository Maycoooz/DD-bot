import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import logoImg from "./assets/logo.png";

const API_BASE = import.meta.env.VITE_API_URL;

// ------------------ Popup Component ------------------
const DeletePopup = ({ isOpen, message, onClose, onConfirm, isSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <p>{message}</p>
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "10px" }}>
          {!isSuccess ? (
            <>
              <button
                className="submit-button"
                onClick={onConfirm}
                style={{ background: "#ef4444" }}
              >
                Delete
              </button>
              <button
                className="submit-button"
                onClick={onClose}
                style={{ background: "#4f46e5" }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="submit-button"
              onClick={onConfirm}
              style={{ background: "#4f46e5" }}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


// ------------------ Header ------------------
const Header = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <img
            src={logoImg || "/placeholder.svg"}
            alt="DD Bot"
            className="logo-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/placeholder.svg";
            }}
          />
        </div>
        <nav className="nav">
          <button onClick={handleLogout} className="nav-link logout-button">
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
};

// ------------------ Parent Dashboard ------------------
const ParentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("kid");
  const [kidAccounts, setKidAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Popup State
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [newKidData, setNewKidData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    password: "",
  });
  const [reviewData, setReviewData] = useState({ message: "", stars: 5 });

  // ------------------ Clear Messages ------------------
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (user?.user_id) {
      fetchKidAccounts();
    }
  }, [user]);

  // ------------------ Fetch Kid Accounts ------------------
  const fetchKidAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/parent/view-kid-accounts/?parent_id=${user.user_id}`,
        { method: "GET", credentials: "include" }
      );
      const data = await response.json();
      setKidAccounts(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load kid accounts.");
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------ Create Kid Account ------------------
  const handleCreateKidAccount = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage("");

    if (!user?.user_id) {
      setError("Parent ID missing.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/parent/create-kid-account/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newKidData, parent_id: user.user_id }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to create kid account.");
        return;
      }

      setSuccessMessage(result.message);
      setNewKidData({ username: "", first_name: "", last_name: "", password: "" });
      fetchKidAccounts();
    } catch (err) {
      console.error(err);
      setError("Failed to create kid account.");
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------ Open Delete Popup ------------------
  const openDeletePopup = (type, id = null, username = "") => {
    setDeleteTarget({ type, id, username });
    setPopupMessage(
      type === "kid"
        ? `Are you sure you want to delete the kid account "${username}"? This cannot be undone.`
        : "Are you sure you want to delete your account? This cannot be undone."
    );
    setPopupOpen(true);
  };

  const closePopup = () => setPopupOpen(false);

  // ------------------ Confirm Delete ------------------
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsLoading(true);

    try {
      if (deleteTarget.type === "kid") {
        const response = await fetch(`${API_BASE}/parent/delete-kid-account/`, {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kid_id: deleteTarget.id, parent_id: user.user_id, username: deleteTarget.username }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          setError(result.message || "Failed to delete kid account.");
        } else {
          setSuccessMessage(result.message);
          fetchKidAccounts();
        }
      } else if (deleteTarget.type === "self") {
      // Delete my account directly
      const response = await fetch(`${API_BASE}/parent/delete-my-account/`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, username: user.username }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.message || "Failed to delete account.");
      } else {
        // Show success popup instead of redirecting immediately
        setPopupMessage("Account deleted successfully!");
        setDeleteTarget({ type: "redirect" });
        setPopupOpen(true);
      }
    } else if (deleteTarget.type === "redirect") {
      // Redirect after user clicks OK on success
      logout();
      navigate("/");
    }
  } catch (err) {
    console.error(err);
    setError("Deletion failed. Please try again.");
  } finally {
    if (deleteTarget?.type !== "redirect") {
      setPopupOpen(deleteTarget?.type === "self"); // keep success popup open for self-delete
      setIsLoading(false);
      setDeleteTarget(deleteTarget?.type === "self" ? { type: "redirect" } : null);
    }
  }
};
  // ------------------ Submit Review ------------------
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage("");

    try {
      const response = await fetch(`${API_BASE}/parent/add-review/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_id: user?.user_id,
          message: reviewData.message.trim(),
          stars: Number(reviewData.stars),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.message || "Failed to submit review.");
      } else {
        setSuccessMessage(result.message);
        setReviewData({ message: "", stars: 5 });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to submit review.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <Header />
      <div className="dashboard-container">
        <h1 className="dashboard-title">Parent Dashboard</h1>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <div className="dashboard-tabs">
          <button className={`tab-button ${activeTab === "kid" ? "active" : ""}`} onClick={() => setActiveTab("kid")}>
            Kid Accounts
          </button>
          <button className={`tab-button ${activeTab === "review" ? "active" : ""}`} onClick={() => setActiveTab("review")}>
            Submit Review
          </button>
          <button className={`tab-button ${activeTab === "account" ? "active" : ""}`} onClick={() => setActiveTab("account")}>
            Account Settings
          </button>
        </div>

        <div className="dashboard-content">
          {/* Kid Accounts Tab */}
          {activeTab === "kid" && (
            <div className="kid-section">
              <h2>Manage Kid Accounts</h2>
              <form onSubmit={handleCreateKidAccount} className="create-kid-form">
                <h3>Create New Kid Account</h3>
                {/* Form fields */}
                {["username", "first_name", "last_name", "password"].map((field) => (
                  <div key={field} className="form-group">
                    <label className="form-label">{field.replace("_", " ").toUpperCase()}</label>
                    <input
                      type={field === "password" ? "password" : "text"}
                      className="form-input"
                      value={newKidData[field]}
                      onChange={(e) => setNewKidData({ ...newKidData, [field]: e.target.value })}
                      required
                    />
                  </div>
                ))}
                <button type="submit" className="submit-button">{isLoading ? "Creating..." : "Create Kid Account"}</button>
              </form>

              <div className="kid-accounts-list">
                <h3>Existing Kid Accounts</h3>
                {isLoading && <p>Loading accounts...</p>}
                {!isLoading && kidAccounts.length === 0 && <p>No kid accounts found.</p>}
                {!isLoading && kidAccounts.length > 0 && (
                  <div className="accounts-grid">
                    {kidAccounts.map((kid) => (
                      <div key={kid.user_id} className="account-card">
                        <h4>{kid.first_name} {kid.last_name}</h4>
                        <p><strong>Username:</strong> {kid.username}</p>
                        <button className="delete-button" onClick={() => openDeletePopup("kid", kid.user_id, kid.username)}>
                          Delete Account
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Review Tab */}
          {activeTab === "review" && (
            <div className="review-section">
              <h2>Submit a Review</h2>
              <form onSubmit={handleSubmitReview}>
                <div className="form-group">
                  <label className="form-label">Your Review</label>
                  <textarea
                    className="form-textarea"
                    value={reviewData.message}
                    onChange={(e) => setReviewData({ ...reviewData, message: e.target.value })}
                    rows="5"
                    required
                  ></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <select className="form-select" value={reviewData.stars} onChange={(e) => setReviewData({ ...reviewData, stars: Number(e.target.value) })}>
                    {[5,4,3,2,1].map(star => <option key={star} value={star}>{star} Star{star>1?'s':''}</option>)}
                  </select>
                </div>
                <button type="submit" className="submit-button">{isLoading ? "Submitting..." : "Submit Review"}</button>
              </form>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === "account" && (
            <div className="account-section">
              <h2>Account Settings</h2>
              <p><strong>Username:</strong> {user.username}</p>
              <div className="danger-zone">
                <h3>Danger Zone</h3>
                <p>Deleting your account will permanently remove all your data, including kid accounts.</p>
                <button className="delete-account-button" onClick={() => openDeletePopup("self")}>
                  Delete My Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Popup */}
      <DeletePopup
        isOpen={popupOpen}
        message={popupMessage}
        isSuccess={deleteTarget?.type === "redirect"}
        onClose={closePopup}
        onConfirm={handleConfirmDelete}
/>

    </div>
  );
};

export default ParentDashboard;
