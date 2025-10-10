import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterLibrarian from './pages/LibrarianRegister';
import ParentDashboard from './pages/ParentDashboard'; 
import ChildDashboard from './pages/ChildDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LibrarianDashboard from './pages/LibrarianDashboard';
import NotFound from './pages/NotFound';
import VerifyEmailPage from './pages/VerifyEmail';
import LandingPage from './pages/LandingPage';

// Utility function to get user authentication status and role
const getCurrentUser = () => {
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('userRole');
    if (!token || !role) return null;
    return { token, role };
};

// Updated ProtectedRoute component
const ProtectedRoute = ({ element, allowedRoles }) => {
    const currentUser = getCurrentUser();

    // If user is not logged in, redirect to the landing page
    if (!currentUser) {
        return <Navigate to="/LandingPage" />;
    }
    
    // If user's role is not allowed, redirect to the main landing page
    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
        return <Navigate to="/LandingPage" />; 
    }

    return element;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/librarianregister" element={<RegisterLibrarian />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                
                {/* This is now the main entry point for everyone */}
                <Route path="/LandingPage" element={<LandingPage />} />
                
                {/* Protected Routes */}
                <Route path="/parent-dashboard" element={<ProtectedRoute element={<ParentDashboard />} allowedRoles={['PARENT']} />} />
                <Route path="/child-dashboard" element={<ProtectedRoute element={<ChildDashboard />} allowedRoles={['CHILD']} />} />
                <Route path="/admin-dashboard" element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={['ADMIN']} />} />
                <Route path="/librarian-dashboard" element={<ProtectedRoute element={<LibrarianDashboard />} allowedRoles={['LIBRARIAN']} />} />
                
                {/* Default Routes */}
                <Route path="/" element={<Navigate to="/LandingPage" />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
}

export default App;