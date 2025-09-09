import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "./AuthContext"
import logoImg from "./assets/logo.png"

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
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("kids")
  const [kidAccounts, setKidAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newKidData, setNewKidData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    password: "",
  })
  const [reviewData, setReviewData] = useState({
    message: "",
    stars: 5,
  })
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    if (user?.id) {
      fetchKidAccounts()
    }
  }, [user])

  const fetchKidAccounts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/parent/view-kid-accounts/?parent_id=${user.id}`, {
        credentials: 'include', // Include cookies in the request
      })
      if (!response.ok) {
        throw new Error("Failed to fetch kid accounts")
      }
      const data = await response.json()
      setKidAccounts(data)
    } catch (err) {
      console.error("Error fetching kid accounts:", err)
      setError("Failed to load kid accounts. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateKidAccount = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMessage("")

    try {
      const response = await fetch("/api/parent/create-kid-account/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({
          ...newKidData,
          parent_id: user.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage("Kid account created successfully!")
        setNewKidData({
          username: "",
          first_name: "",
          last_name: "",
          password: "",
        })
        fetchKidAccounts()
      } else {
        setError(data.message || "Failed to create kid account")
      }
    } catch (err) {
      console.error("Error creating kid account:", err)
      setError("Failed to create kid account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteKidAccount = async (kidId) => {
    if (!window.confirm("Are you sure you want to delete this kid account?")) {
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccessMessage("")

    try {
      const response = await fetch("/api/parent/delete-kid-account/", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({
          kid_id: kidId,
          parent_id: user.id,
          username: kidAccounts.find(kid => kid.user_id === kidId)?.username || "",
        }),
      })

      if (response.ok) {
        setSuccessMessage("Kid account deleted successfully!")
        fetchKidAccounts()
      } else {
        setError("Failed to delete kid account")
      }
    } catch (err) {
      console.error("Error deleting kid account:", err)
      setError("Failed to delete kid account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMessage("")

    try {
      const response = await fetch("/api/parent/add-review/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({
          parent_id: user.id,
          message: reviewData.message,
          stars: parseInt(reviewData.stars),
        }),
      })

      if (response.ok) {
        setSuccessMessage("Review submitted successfully!")
        setReviewData({
          message: "",
          stars: 5,
        })
      } else {
        setError("Failed to submit review")
      }
    } catch (err) {
      console.error("Error submitting review:", err)
      setError("Failed to submit review. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This will also delete all kid accounts associated with your account and cannot be undone.")) {
      return
    }

    const password = prompt("Please enter your password to confirm account deletion:")
    if (!password) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/parent/delete-my-account/", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({
          user_id: user.id,
          username: user.username,
          password: password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert("Your account has been successfully deleted.")
        logout()
        navigate("/login")
      } else {
        setError(data.message || "Failed to delete account")
      }
    } catch (err) {
      console.error("Error deleting account:", err)
      setError("Failed to delete account. Please try again.")
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
            className={`tab-button ${activeTab === "kids" ? "active" : ""}`}
            onClick={() => setActiveTab("kids")}
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
          {activeTab === "kids" && (
            <div className="kids-section">
              <h2>Manage Kid Accounts</h2>
              
              <div className="create-kid-form">
                <h3>Create New Kid Account</h3>
                <form onSubmit={handleCreateKidAccount}>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newKidData.username}
                      onChange={(e) => setNewKidData({...newKidData, username: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newKidData.first_name}
                      onChange={(e) => setNewKidData({...newKidData, first_name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newKidData.last_name}
                      onChange={(e) => setNewKidData({...newKidData, last_name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={newKidData.password}
                      onChange={(e) => setNewKidData({...newKidData, password: e.target.value})}
                      required
                    />
                  </div>
                  
                  <button type="submit" className="submit-button" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Kid Account"}
                  </button>
                </form>
              </div>
              
              <div className="kid-accounts-list">
                <h3>Existing Kid Accounts</h3>
                {isLoading && <p>Loading accounts...</p>}
                
                {!isLoading && kidAccounts.length === 0 && (
                  <p>No kid accounts found. Create one above!</p>
                )}
                
                {!isLoading && kidAccounts.length > 0 && (
                  <div className="accounts-grid">
                    {kidAccounts.map((kid) => (
                      <div key={kid.user_id} className="account-card">
                        <h4>{kid.first_name} {kid.last_name}</h4>
                        <p><strong>Username:</strong> {kid.username}</p>
                        <button 
                          className="delete-button"
                          onClick={() => handleDeleteKidAccount(kid.user_id)}
                          disabled={isLoading}
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
                    onChange={(e) => setReviewData({...reviewData, message: e.target.value})}
                    rows="5"
                    required
                  ></textarea>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Rating (1-5 stars)</label>
                  <select
                    className="form-select"
                    value={reviewData.stars}
                    onChange={(e) => setReviewData({...reviewData, stars: e.target.value})}
                    required
                  >
                    <option value="5">5 Stars - Excellent</option>
                    <option value="4">4 Stars - Very Good</option>
                    <option value="3">3 Stars - Good</option>
                    <option value="2">2 Stars - Fair</option>
                    <option value="1">1 Star - Poor</option>
                  </select>
                </div>
                
                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>
          )}
          
          {activeTab === "account" && (
            <div className="account-section">
              <h2>Account Settings</h2>
              
              <div className="account-info">
                <h3>Your Account Information</h3>
                <p><strong>Username:</strong> {user?.username}</p>
              </div>
              
              <div className="danger-zone">
                <h3>Danger Zone</h3>
                <p>Deleting your account will permanently remove all your data, including all kid accounts associated with your account. This action cannot be undone.</p>
                
                <button 
                  className="delete-account-button"
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                >
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