import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext"

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth()

  console.log("ProtectedRoute → user:", user)
  console.log("ProtectedRoute → allowedRoles:", allowedRoles)

  if (isLoading) return <div>Loading...</div>

  if (!user) {
    console.warn("ProtectedRoute → No user, redirecting to /login")
    return <Navigate to="/login" />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn(`ProtectedRoute → Role '${user.role}' not allowed, redirecting to /`)
    return <Navigate to="/" />
  }

  console.log("ProtectedRoute → Access granted")
  return children
}

export default ProtectedRoute
