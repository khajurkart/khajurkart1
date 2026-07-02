import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Admin Configuration ───────────────────────────────────────────────────────

const ADMIN_EMAILS = ["admin@khajurkart.com", "khajurkart@gmail.com"];

// ─── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

// ─── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("token");
        }
        return null;
    });
    const [loading, setLoading] = useState(true);

    // ── Logout ─────────────────────────────────────────────────────────────────

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        setToken(null);
        setUser(null);
    }, []);

    // ── Fetch User ─────────────────────────────────────────────────────────────

    const fetchUser = useCallback(async () => {
        try {
            const savedToken = localStorage.getItem("token");
            
            if (!savedToken) {
                setLoading(false);
                return;
            }

            const res = await axios.get(`${API}/auth/me`, {
                headers: { Authorization: `Bearer ${savedToken}` }
            });

            // ✅ Kick out unverified users on reload
            if (res.data.is_verified === false) {
                logout();
                return;
            }

            setUser(res.data);

            // ✅ Check and set admin status
            if (ADMIN_EMAILS.includes(res.data.email)) {
                localStorage.setItem('isAdmin', 'true');
            } else {
                localStorage.removeItem('isAdmin');
            }

        } catch (error) {
            console.error('Fetch user error:', error);
            logout();
        } finally {
            setLoading(false);
        }
    }, [logout]);

    // ── Initialize ─────────────────────────────────────────────────────────────

    useEffect(() => {
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [token, fetchUser]);

    // ── Login ──────────────────────────────────────────────────────────────────

    const login = async (email, password) => {
        try {
            const response = await axios.post(`${API}/login`, { 
                email, 
                password 
            });

            const { access_token, user: userData } = response.data;

            // Store token
            localStorage.setItem('token', access_token);
            setToken(access_token);
            setUser(userData);

            // ✅ Check if admin
            if (ADMIN_EMAILS.includes(userData.email)) {
                localStorage.setItem('isAdmin', 'true');
            } else {
                localStorage.removeItem('isAdmin');
            }

            return userData;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    // ── Register ───────────────────────────────────────────────────────────────

    const register = async (name, email, password, phone) => {
        try {
            const response = await axios.post(`${API}/auth/register`, {
                name, 
                email, 
                password, 
                phone
            });
            return response.data;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    };

    // ── Set Auth (after email verification) ───────────────────────────────────

    const setAuth = (access_token, userData) => {
        localStorage.setItem('token', access_token);
        setToken(access_token);
        setUser(userData);

        // ✅ Check if admin
        if (ADMIN_EMAILS.includes(userData.email)) {
            localStorage.setItem('isAdmin', 'true');
        } else {
            localStorage.removeItem('isAdmin');
        }
    };

    // ── Check if current user is admin ────────────────────────────────────────

    const isAdmin = useCallback(() => {
        if (!user) return false;
        return ADMIN_EMAILS.includes(user.email);
    }, [user]);

    // ── Get admin status from localStorage ────────────────────────────────────

    const getAdminStatus = () => {
        return localStorage.getItem('isAdmin') === 'true';
    };

    // ── Context Value ──────────────────────────────────────────────────────────

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        setAuth,
        isAdmin,
        getAdminStatus,
        ADMIN_EMAILS, // Export for use in components
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// ─── Export Context ────────────────────────────────────────────────────────────

export default AuthContext;
