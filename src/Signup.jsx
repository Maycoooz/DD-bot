import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "./AuthContext"
import showImg from "./assets/visibility_off.png"
import hideImg from "./assets/visibility_on.png"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    usertype: "parent", // Default role
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { signup, isLoading } = useAuth()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    // Basic validation
    if (!formData.username || !formData.password || !formData.email || !formData.usertype) {
      setError("All required fields must be filled")
      return
    }


      const result = await signup(formData)
      if (result.success) {
        setTimeout(() => {
          navigate("/login")
        }, 1500)
      }else {
  setError(result.message)
}
  }

  return (
    <div className="app">
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Create a New Account</h1>
          <form onSubmit={handleSubmit} className="login-form">
            {/* Username */}
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                className="form-input"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            {/* First Name */}
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                name="first_name"
                className="form-input"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Last Name */}
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                name="last_name"
                className="form-input"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password */}
            <div className="form-group password-group">
              <label className="form-label">Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="form-input"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <img
                  src={showPassword ? hideImg : showImg}
                  alt="Toggle Password"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>
            </div>

            {/* Role */}
            <div className="form-group">
              <label className="form-label">Select Role</label>
              <select
                name="usertype"
                className="form-select"
                value={formData.usertype}
                onChange={handleChange}
                required
              >
                <option value="">Choose your role...</option>
                <option value="parent">Parent</option>
                <option value="librarian">Librarian</option>
              </select>
            </div>

            {/* Error Message */}
            {error && <div className="error-message">{error}</div>}

            {/* Submit Button */}
            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? "Creating..." : "Sign Up"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
