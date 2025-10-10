import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ParentDashboard from './pages/ParentDashboard'; 
import ChildDashboard from './pages/ChildDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import VerifyEmailPage from './pages/VerifyEmail';

// 1. Expanded utility function to get user data
const getCurrentUser = () => {
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('userRole');
    
    if (!token || !role) {
        return null; // Not authenticated
    }
    return { token, role };
};

// 2. A more powerful ProtectedRoute component
const ProtectedRoute = ({ element, allowedRoles }) => {
    const currentUser = getCurrentUser();

    // If user is not logged in, redirect to login
    if (!currentUser) {
        return <Navigate to="/login" />;
    }
    
    // If the route requires specific roles and the user's role is not included,
    // redirect them to a default or unauthorized page.
    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
        // You could redirect to a dedicated 'Unauthorized' page or their own dashboard
        return <Navigate to="/" />; 
    }

    return element;
};

// 3. A component to handle the initial redirect logic
const HomeRedirect = () => {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    // Redirect logged-in users to their respective dashboards
    switch (currentUser.role) {
        case 'PARENT':
            return <Navigate to="/parent-dashboard" />;
        case 'CHILD':
            return <Navigate to="/child-dashboard" />;
        case 'ADMIN':
            return <Navigate to="/admin-dashboard" />;
        default:
            return <Navigate to="/login" />;
    }
};


function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                
                {/* 4. Protected Routes with role-based access */}
                <Route path="/parent-dashboard" element={<ProtectedRoute element={<ParentDashboard />} allowedRoles={['PARENT']} />} />
                <Route path="/child-dashboard" element={<ProtectedRoute element={<ChildDashboard />} allowedRoles={['CHILD']} />} />
                <Route path="/admin-dashboard" element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={['ADMIN']} />} />
                
                {/* Default Routes */}
                <Route path="/" element={<HomeRedirect />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
}

export default App;