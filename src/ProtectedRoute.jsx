import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext"

const ProtectedRoute = ({ children, allowedRoles }) => {
const { user, isLoading } = useAuth()

if (isLoading) return <div>Loading...</div>

if (!user) return <Navigate to="/login" />

if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />
}

return children
}

export default ProtectedRoute
