// src/layouts/auth/AuthLayout.jsx
import { Outlet, Navigate, useLocation } from "react-router-dom";
import AuthService from "@/services/auth/auth.service";

export default function AuthLayout() {
  const user = AuthService.getCurrentUser();
  const location = useLocation();

  if (!user) {
    // ยังไม่ล็อกอิน -> ไปหน้า login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // ล็อกอินแล้ว -> ให้ Route ลูกเรนเดอร์ผ่าน Outlet
  return <Outlet />;
}
