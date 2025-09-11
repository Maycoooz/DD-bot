import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "./AuthContext"
import logoImg from "./assets/logo.png"

const API_BASE = "http://localhost:8000"

const Header = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <img
            src={logoImg || "/placeholder.svg"}
            alt="DD Bot"
            className="logo-image"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = "/placeholder.svg"
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
  )
}

const ParentDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("kid")
  const [kidAccounts, setKidAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(false) // start as false
  const [error, setError] = useState(null)
  const [newKidData, setNewKidData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    password: "",
  })
  const [reviewData, setReviewData] = useState({ message: "", stars: 5 })
  const [successMessage, setSuccessMessage] = useState("")

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  useEffect(() => {
    if (user?.user_id) {
      fetchKidAccounts()
    }
  }, [user])

  // ------------------ Fetch Kid Accounts ------------------
  const fetchKidAccounts = async () => {
    setIsLoading(true)
    try {
      console.log("📡 Fetching kid accounts for parent:", user?.user_id)
      const response = await fetch(
        `${API_BASE}/parent/view-kid-accounts/?parent_id=${user.user_id}`,
        {
          method: "GET",
          credentials: "include",
        }
      )
      console.log("FetchKidAccounts status:", response.status)
      const data = await response.json()
      console.log("FetchKidAccounts response:", data)
      setKidAccounts(data)
      setError(null)
    } catch (err) {
      console.error("Error fetching kid accounts:", err)
      setError("Failed to load kid accounts. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  // ------------------ Create Kid Account ------------------
  const handleCreateKidAccount = async (e) => {
    e.preventDefault()
    console.log("🔵 handleCreateKidAccount clicked")
    setIsLoading(true)
    setError(null)
    setSuccessMessage("")

    try {
      const response = await fetch(`api/parent/create-kid-account/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newKidData.username,
          first_name: newKidData.first_name,
          last_name: newKidData.last_name,
          password: newKidData.password,
          parent_id: user?.user_id,

        }),
      })

      console.log("CreateKid response status:", response.status)
      const result = await response.json()
      console.log("CreateKid response body:", result)

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to create kid account.")
        return
      }

      setSuccessMessage(result.message)
      setNewKidData({ username: "", first_name: "", last_name: "", password: "",email: null,usertype: "kid" })
      fetchKidAccounts()
    } catch (err) {
      console.error("Error creating kid account:", err)
      setError("Failed to create kid account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // ------------------ Delete Kid Account ------------------
  const handleDeleteKidAccount = async (kidId, kidUsername) => {
    if (!window.confirm("Are you sure you want to delete this kid account?")) return
    console.log("🗑️ handleDeleteKidAccount clicked for:", kidId, kidUsername)
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/parent/delete-kid-account/`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kid_id: kidId,
          parent_id: user.user_id,
          username: kidUsername, // required in schema
        }),
      })

      console.log("DeleteKid response status:", response.status)
      const result = await response.json()
      console.log("DeleteKid response body:", result)

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to delete kid account.")
        return
      }

      setSuccessMessage(result.message)
      fetchKidAccounts()
    } catch (err) {
      console.error("Error deleting kid account:", err)
      setError("Failed to delete kid account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // ------------------ Submit Review ------------------
  const handleSubmitReview = async (e) => {
    e.preventDefault()
    console.log("🟢 handleSubmitReview clicked")
    setIsLoading(true)
    setError(null)
    setSuccessMessage("")

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
      })

      console.log("AddReview response status:", response.status)
      const result = await response.json()
      console.log("AddReview response body:", result)

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to submit review.")
        return
      }

      setSuccessMessage(result.message)
      setReviewData({ message: "", stars: 5 })
    } catch (err) {
      console.error("Error submitting review:", err)
      setError("Failed to submit review.")
    } finally {
      setIsLoading(false)
    }
  }

  // ------------------ Delete Parent Account ------------------
  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account?")) return
    const password = prompt("Enter your password to confirm:")
    if (!password) return
    console.log("❌ handleDeleteAccount clicked")
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/parent/delete-my-account/`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.user_id,
          username: user?.username,
          password: password,
        }),
      })

      console.log("DeleteParent response status:", response.status)
      const result = await response.json()
      console.log("DeleteParent response body:", result)

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to delete account.")
        return
      }

      alert(result.message)
      logout()
      navigate("/login")
    } catch (err) {
      console.error("Error deleting account:", err)
      setError("Failed to delete account.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app">
      <Header />
      <div className="dashboard-container">
        <h1 className="dashboard-title">Parent Dashboard</h1>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === "kid" ? "active" : ""}`}
            onClick={() => setActiveTab("kid")}
          >
            Kid Accounts
          </button>
          <button
            className={`tab-button ${activeTab === "review" ? "active" : ""}`}
            onClick={() => setActiveTab("review")}
          >
            Submit Review
          </button>
          <button
            className={`tab-button ${activeTab === "account" ? "active" : ""}`}
            onClick={() => setActiveTab("account")}
          >
            Account Settings
          </button>
        </div>

        <div className="dashboard-content">
          {/* Kid Accounts Tab */}
          {activeTab === "kid" && (
            <div className="kid-section">
              <h2>Manage Kid Accounts</h2>
              <div className="create-kid-form">
                <h3>Create New Kid Account</h3>
                <form onSubmit={handleCreateKidAccount}>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      name="username"
                      className="form-input"
                      value={newKidData.username}
                      onChange={(e) => setNewKidData({ ...newKidData, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      className="form-input"
                      value={newKidData.first_name}
                      onChange={(e) => setNewKidData({ ...newKidData, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      className="form-input"
                      value={newKidData.last_name}
                      onChange={(e) => setNewKidData({ ...newKidData, last_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      name="password"
                      className="form-input"
                      value={newKidData.password}
                      onChange={(e) => setNewKidData({ ...newKidData, password: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="submit-button">
                    {isLoading ? "Creating..." : "Create Kid Account"}
                  </button>
                </form>
              </div>

              <div className="kid-accounts-list">
                <h3>Existing Kid Accounts</h3>
                {isLoading && <p>Loading accounts...</p>}
                {!isLoading && kidAccounts.length === 0 && <p>No kid accounts found. Create one above!</p>}
                {!isLoading && kidAccounts.length > 0 && (
                  <div className="accounts-grid">
                    {kidAccounts.map((kid) => (
                      <div key={kid.user_id} className="account-card">
                        <h4>
                          {kid.first_name} {kid.last_name}
                        </h4>
                        <p>
                          <strong>Username:</strong> {kid.username}
                        </p>
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteKidAccount(kid.user_id, kid.username)}
                        >
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
              <p>Share your experience with DD Bot to help other parents!</p>
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
                  <label className="form-label">Rating (1-5 stars)</label>
                  <select
                    className="form-select"
                    value={reviewData.stars}
                    onChange={(e) => setReviewData({ ...reviewData, stars: Number(e.target.value) })}
                    required
                  >
                    <option value="5">5 Stars - Excellent</option>
                    <option value="4">4 Stars - Very Good</option>
                    <option value="3">3 Stars - Good</option>
                    <option value="2">2 Stars - Fair</option>
                    <option value="1">1 Star - Poor</option>
                  </select>
                </div>
                <button type="submit" className="submit-button">
                  {isLoading ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>
          )}

          {/* Account Settings Tab */}
          {activeTab === "account" && (
            <div className="account-section">
              <h2>Account Settings</h2>
              <div className="account-info">
                <h3>Your Account Information</h3>
                <p>
                  <strong>Username:</strong> {user?.username}
                </p>
              </div>
              <div className="danger-zone">
                <h3>Danger Zone</h3>
                <p>
                  Deleting your account will permanently remove all your data, including all kid
                  accounts associated with your account. This action cannot be undone.
                </p>
                <button className="delete-account-button" onClick={handleDeleteAccount}>
                  Delete My Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ParentDashboard
