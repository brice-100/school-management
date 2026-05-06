import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginService, getMe } from '../services/authServices';

const AuthContext = createContext(null);

  export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  // On initialise 'loading' à true SEULEMENT s'il y a un token à vérifier
  const [loading, setLoading] = useState(() => {
    return !!localStorage.getItem('token'); 
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getMe()
        .then(({ user }) => setUser(user))
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    }
    // Plus besoin de "else", car si pas de token, loading est déjà false !
  }, []);

  // ... reste du code (login, logout)

  const login = async (username, password, userType) => {
    const response = await loginService(username, password, userType)
    const data = response.data
    localStorage.setItem('token', data.token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être dans AuthProvider');
  return ctx;
};
