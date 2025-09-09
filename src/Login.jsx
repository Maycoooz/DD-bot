"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "./AuthContext"
import logoImg from "./assets/logo.png"
import showImg from "./assets/visibility_off.png"
import hideImg from "./assets/visibility_on.png"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    role: "parent", // Default to parent role
    username: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (error) setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    // Basic validation
    if (!formData.role || !formData.username || !formData.password) {
      setError("Please fill in all fields")
      return
    }

    try {
      const result = await login(formData)
      if (result.success) {
        navigate(result.redirect)
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.")
    }
  }

  return (
    <div className="app">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <img
              src={logoImg || "/placeholder.svg"}
              alt="DD Bot"
              className="login-logo"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = "/placeholder.svg"
              }}
            />
            <h1 className="login-title">Welcome to DD Bot</h1>
            <p className="login-subtitle">Please sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="role" className="form-label">
                Select Your Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="form-select"
                required
              >
                <option value="">Choose your role...</option>
                <option value="admin">Administrator</option>
                <option value="parent">Parent</option>
                <option value="kid">Kid</option>
                <option value="librarian">Librarian</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="username" className="form-label">
                User ID
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your user ID"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your password"
                required
              />
            <img
            src={showPassword ? hideImg : showImg}
            alt="Toggle Password"
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}/>
            </div>
          </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="login-footer">
            <p className="login-help">
            Need help? Contact your administrator or parent for login credentials.
            </p>
            <p className="signup-text">
              Don’t have an account?{" "}
              <button
              type="button"
              className="signup-link"
              onClick={() => navigate("/signup")}
              >
              Sign up here
              </button>
              </p>
          </div>
        </div>
      </div>
    </div>
  )
}
