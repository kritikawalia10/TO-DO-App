import React, { createContext, useState, useEffect } from 'react';
import client from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      client.setAuthToken(token);
      localStorage.setItem('token', token);
      // optionally fetch current user
    } else {
      client.setAuthToken(null);
      localStorage.removeItem('token');
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
