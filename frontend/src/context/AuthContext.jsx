import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

const initialState = {
  user: JSON.parse(localStorage.getItem('splito_user')) || null,
  token: localStorage.getItem('splito_token') || null,
  loading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload.user, token: action.payload.token, loading: false };
    case 'LOGOUT':
      return { user: null, token: null, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('splito_token');
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      try {
        const res = await api.get('/auth/me');
        dispatch({ type: 'SET_USER', payload: { user: res.data.user, token } });
      } catch {
        localStorage.removeItem('splito_token');
        localStorage.removeItem('splito_user');
        dispatch({ type: 'LOGOUT' });
      }
    };
    verifyToken();
  }, []);

  const login = useCallback((token, user) => {
    localStorage.setItem('splito_token', token);
    localStorage.setItem('splito_user', JSON.stringify(user));
    dispatch({ type: 'SET_USER', payload: { user, token } });
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('splito_token');
    localStorage.removeItem('splito_user');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateUser = useCallback((updates) => {
    const updated = { ...state.user, ...updates };
    localStorage.setItem('splito_user', JSON.stringify(updated));
    dispatch({ type: 'UPDATE_USER', payload: updates });
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
