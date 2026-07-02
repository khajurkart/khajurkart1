// src/components/ProtectedAdminRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedAdminRoute = ({ children }) => {
    const { user, token } = useAuth();
    
    if (!token || !user) {
        return <Navigate to="/admin/login" replace />;
    }
    
    if (user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }
    
    return children;
};

export default ProtectedAdminRoute;
