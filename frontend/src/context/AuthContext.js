import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
console.log("Backend URL:", BACKEND_URL);
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
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await axios.get(`${API}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    setUser(res.data);
  } catch (error) {
    console.error('Failed to fetch user', error);
    logout();
  } finally {
    setLoading(false);
  }
}, [token, logout]);

  
useEffect(() => {
  console.log("TOKEN:", token);
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    fetchUser();
  } else {
    setLoading(false);
  }
}, [token, fetchUser]);
  
useEffect(() => {
  console.log("LOCAL STORAGE TEST:", localStorage.getItem("token"));
}, []);

  const login = async (email, password) => {
    const response = await axios.post(`${API}/login`, { email, password });
    const { access_token, user: userData } = response.data;
    console.log("SAVING TOKEN:", access_token);
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, phone) => {
    const response = await axios.post(`${API}/auth/register`, { name, email, password, phone });
    console.log("LOGIN RESPONSE:", response.data);
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(userData);
    axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`; 
    return userData;
  };

  const loginWithGoogle = (data) => {
  console.log("GOOGLE RESPONSE:", data);

  localStorage.setItem("token", data.access_token); // ✅ MUST
  setToken(data.access_token);
  setUser(data.user);

  axios.defaults.headers.common["Authorization"] =
    `Bearer ${data.access_token}`;
};
 //const logout = () => {
//   localStorage.removeItem('token');
  // setToken(null);
    //setUser(null);
 // };

  return (
    <AuthContext.Provider value={{ user, token, login, register, loginWithGoogle, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
