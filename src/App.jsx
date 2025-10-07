import { Routes, Route } from "react-router-dom"
import HomePage from "./HomePage"
import LoginPage from "./Login"
import ChatbotPage from "./ChatbotPage"
import SignupPage from "./Signup"
import ParentDashboard from "./ParentDashboard"
import AdminDashboard from "./AdminDashboard"
import LibrarianDashboard from "./LibrarianDashboard"
import ProtectedRoute from "./ProtectedRoute"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/chat" element={<ChatbotPage />} />
      <Route
        path="/parent-dashboard"
        element={
          <ProtectedRoute allowedRoles={["parent"]}>
            <ParentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/librarian-dashboard"
        element={
          <ProtectedRoute allowedRoles={["librarian"]}>
            <LibrarianDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
