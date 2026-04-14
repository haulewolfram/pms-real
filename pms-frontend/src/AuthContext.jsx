import { createContext, useContext, useState, useEffect } from 'react';
import api from './api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const token = localStorage.getItem('pms_token');
      if (token) {
        try {
          const res = await api.get('/user');
          setUser(res.data);
        } catch (error) {
          console.error("Auth check failed", error);
          localStorage.removeItem('pms_token');
        }
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/login', { email, password });
    localStorage.setItem('pms_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('pms_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
