import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("token");
        }
        return null;
    });
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    }, []);

    const fetchUser = useCallback(async () => {
        try {
            const savedToken = localStorage.getItem("token");
            const res = await axios.get(`${BACKEND_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${savedToken}` }
            });

            // ✅ Kick out unverified users on reload
            if (res.data.is_verified === false) {
                logout();
                return;
            }

            setUser(res.data);
        } catch (error) {
            logout();
        } finally {
            setLoading(false);
        }
    }, [logout]);

    useEffect(() => {
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [token, fetchUser]);

    // ✅ Normal login with email/password
    const login = async (email, password) => {
        const response = await axios.post(`${API}/login`, { email, password });
        const { access_token, user: userData } = response.data;
        localStorage.setItem('token', access_token);
        setToken(access_token);
        setUser(userData);
        return userData;
    };

    // ✅ Register - NO token saved
    const register = async (name, email, password, phone) => {
        const response = await axios.post(`${API}/auth/register`, {
            name, email, password, phone
        });
        return response.data;
    };

    // ✅ NEW - Set auth directly after email verification
    const setAuth = (access_token, userData) => {
        localStorage.setItem('token', access_token);
        setToken(access_token);
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            register,
            logout,
            loading,
            setAuth  // ✅ exported
        }}>
            {children}
        </AuthContext.Provider>
    );
};
