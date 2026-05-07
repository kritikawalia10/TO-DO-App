import React, { createContext, useState, useEffect } from 'react';
import client from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      client.setAuthToken(token);
      localStorage.setItem('token', token);
      if (user) localStorage.setItem('user', JSON.stringify(user));
    } else {
      client.setAuthToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [token]);

  const login = ({ user, token }) => {
    setUser(user);
    setToken(token);
  };
  const logout = () => { setUser(null); setToken(null); };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
