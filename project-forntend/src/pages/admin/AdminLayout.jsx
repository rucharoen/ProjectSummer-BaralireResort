// src/layouts/admin/AdminLayout.jsx
import { Outlet } from "react-router-dom";
import ProtectedRoute from "@/middleware/ProtectedRoute";
// ถ้าต้องการ Navbar พิเศษสำหรับแอดมิน ให้ import มาวางได้
// import AdminNavbar from "../common/AdminNavbar";

export default function AdminLayout() {
  return (
    <ProtectedRoute roles={["ROLE_ADMIN", "ROLE_MODERATOR"]}>
      {/* <AdminNavbar /> */}
      <Outlet />
    </ProtectedRoute>
  );
}
