import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser, logoutUser, getToken } from "../services/api";

export const AuthContext = createContext({
  user: null, setUser: () => {}, loading: false, logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check session if token exists in localStorage
    if (!getToken()) { setLoading(false); return; }
    getCurrentUser()
      .then(setUser)
      .catch(() => { setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await logoutUser(); // just clears localStorage token
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}