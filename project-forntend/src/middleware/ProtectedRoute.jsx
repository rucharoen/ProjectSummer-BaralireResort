// src/middleware/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import AuthService from "@/services/auth/auth.service";

/**
 * <ProtectedRoute roles={["ROLE_ADMIN","ROLE_MODERATOR"]}>
 *   <YourComponent/>
 * </ProtectedRoute>
 *
 * ถ้าไม่ได้ส่ง roles มา จะเช็คแค่ว่าล็อกอินหรือยัง
 */
export default function ProtectedRoute({ children, roles }) {
  const user = AuthService.getCurrentUser();
  const location = useLocation();

  // ยังไม่ล็อกอิน -> ไป login พร้อม state ที่มาจากไหน
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // ถ้าระบุ roles -> ต้องมีอย่างน้อยหนึ่งบทบาทที่ตรง
  if (Array.isArray(roles) && roles.length > 0) {
    const userRoles = user.roles || [];
    const ok = userRoles.some((r) => roles.includes(r));
    if (!ok) {
      // ไม่มีสิทธิ์ -> ส่งกลับหน้าแรก หรือจะเปลี่ยนเป็น /403 ก็ได้
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
