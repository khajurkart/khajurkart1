// components/AdminProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_EMAILS = ["admin@khajurkart.com", "khajurkart@gmail.com"];

const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-khajur-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!ADMIN_EMAILS.includes(user.email)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
