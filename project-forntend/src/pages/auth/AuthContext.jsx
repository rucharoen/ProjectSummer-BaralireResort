// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import AuthService from "../../services/auth/auth.service";

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => AuthService.getCurrentUser());

  // sync เมื่อมีการเปลี่ยนจากแหล่งอื่น (เผื่ออนาคตมีหลายจุด)
  useEffect(() => {
    const onChanged = () => setUser(AuthService.getCurrentUser());
    window.addEventListener("auth:changed", onChanged);
    return () => window.removeEventListener("auth:changed", onChanged);
  }, []);

  const login = useCallback(async (email, password) => {
    const u = await AuthService.login(email, password); // ให้ service เก็บ localStorage
    setUser(u);
    // บรอดแคสต์ให้ที่อื่นรู้ (กันพลาด)
    window.dispatchEvent(new Event("auth:changed"));
    return u;
  }, []);

  const logout = useCallback(() => {
    AuthService.logout(); // ลบ token/localStorage ให้เรียบร้อย
    setUser(null);
    window.dispatchEvent(new Event("auth:changed"));
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
