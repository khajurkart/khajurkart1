
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ADMIN_EMAILS = [
    'admin@khajurkart.com',
    'khajurkart@gmail.com',
];

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
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    });

    const [loading, setLoading] = useState(true);

    // ── Logout ────────────────────────────────────────────────────────────────

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');

        setToken(null);
        setUser(null);
    }, []);

    // ── Delete Account ────────────────────────────────────────────────────────

    const deleteAccount = useCallback(async () => {
        const savedToken = localStorage.getItem('token');

        if (!savedToken) {
            throw new Error('Please log in before deleting your account.');
        }

        if (
            user &&
            ADMIN_EMAILS.includes(user.email.toLowerCase())
        ) {
            throw new Error('Administrator accounts cannot be deleted here.');
        }

        // The backend must implement this authenticated DELETE endpoint.
        await axios.delete(`${API}/user/account`, {
            headers: {
                Authorization: `Bearer ${savedToken}`,
            },
        });

        // Only log out after the backend confirms successful deletion.
        logout();
    }, [user, logout]);

    // ── Fetch User ────────────────────────────────────────────────────────────

    const fetchUser = useCallback(async () => {
        try {
            const savedToken = localStorage.getItem('token');

            if (!savedToken) {
                setUser(null);
                return;
            }

            const res = await axios.get(`${API}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${savedToken}`,
                },
            });

            if (res.data.is_verified === false) {
                logout();
                return;
            }

            setUser(res.data);

            if (ADMIN_EMAILS.includes(res.data.email?.toLowerCase())) {
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

    // ── Initialize ────────────────────────────────────────────────────────────

    useEffect(() => {
        if (token) {
            fetchUser();
        } else {
            setUser(null);
            setLoading(false);
        }
    }, [token, fetchUser]);

    // ── Login ─────────────────────────────────────────────────────────────────

    const login = async (email, password) => {
        try {
            const response = await axios.post(`${API}/login`, {
                email,
                password,
            });

            const { access_token, user: userData } = response.data;

            localStorage.setItem('token', access_token);
            setToken(access_token);
            setUser(userData);

            if (ADMIN_EMAILS.includes(userData.email?.toLowerCase())) {
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

    // ── Register ──────────────────────────────────────────────────────────────

    const register = async (name, email, password, phone) => {
        try {
            const response = await axios.post(`${API}/auth/register`, {
                name,
                email,
                password,
                phone,
            });

            return response.data;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    };

    // ── Set Auth after email verification ─────────────────────────────────────

    const setAuth = (access_token, userData) => {
        localStorage.setItem('token', access_token);
        setToken(access_token);
        setUser(userData);

        if (ADMIN_EMAILS.includes(userData.email?.toLowerCase())) {
            localStorage.setItem('isAdmin', 'true');
        } else {
            localStorage.removeItem('isAdmin');
        }
    };

    // ── Admin Helpers ─────────────────────────────────────────────────────────

    const isAdmin = useCallback(() => {
        if (!user) return false;
        return ADMIN_EMAILS.includes(user.email?.toLowerCase());
    }, [user]);

    const getAdminStatus = () => {
        return localStorage.getItem('isAdmin') === 'true';
    };

    // ── Context Value ─────────────────────────────────────────────────────────

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        deleteAccount,
        setAuth,
        isAdmin,
        getAdminStatus,
        ADMIN_EMAILS,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
