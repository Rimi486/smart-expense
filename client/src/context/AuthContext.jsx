import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setCurrency, setToken, setUnauthorizedHandler } from '../api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken())); // true while we check a saved login

  const setUser = useCallback((u) => { setCurrency(u?.currency); setUserState(u); }, []);
  const logout = useCallback(() => { setToken(null); setUser(null); }, [setUser]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!getToken()) return;
    api.me().then((r) => setUser(r.user)).catch(logout).finally(() => setLoading(false));
  }, [logout, setUser]);

  async function login(email, password) {
    const r = await api.login({ email, password });
    setToken(r.token);
    setUser(r.user);
  }
  async function register(data) {
    const r = await api.register(data);
    setToken(r.token);
    setUser(r.user);
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>{children}</AuthContext.Provider>;
}
