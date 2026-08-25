// components/AdminProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const AdminProtectedRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-khajur-cream">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-khajur-gold" />
          <p className="text-sm text-khajur-dark/50 font-medium">
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to admin login if not logged in
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Redirect to home if not admin
  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  // Render protected content
  return children;
};

export default AdminProtectedRoute;
