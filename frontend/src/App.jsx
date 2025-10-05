import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
// Create these files next:
import ParentDashboard from './pages/ParentDashboard'; 
import ChildDashboard from './pages/ChildDashboard';
import NotFound from './pages/NotFound'; // Placeholder for 404

// Utility function to check if the user is logged in
const isAuthenticated = () => {
    // Check if the access token exists in storage
    return !!localStorage.getItem('accessToken');
};

// Component to protect routes
const PrivateRoute = ({ element }) => {
    return isAuthenticated() ? element : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Route */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Routes */}
                <Route path="/parent-dashboard" element={<PrivateRoute element={<ParentDashboard />} />} />
                <Route path="/child-dashboard" element={<PrivateRoute element={<ChildDashboard />} />} />
                
                {/* Default Routes */}
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="*" element={<NotFound />} /> {/* Catch-all for 404 */}
            </Routes>
        </Router>
    );
}

export default App;
