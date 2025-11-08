// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "../layouts/main/MainLayout";
import AdminLayout from "../layouts/admin/AdminLayout";
import AuthLayout from "../layouts/auth/AuthLayout";

import HomePage from "../pages/main/home/HomePage";
import LoginPage from "../pages/main/login/LoginPage";
import SearchPage from "../pages/main/search/SearchPage";
import BookPage from "../pages/main/book/BookPage";

import MyBookingPage from "../pages/auth/MyBookingPage";
import AccountPage from "../pages/main/account/AccountPage"; // ⬅️ หน้าโปรไฟล์ที่เราเพิ่ม

import DashboardPage from "../pages/admin/DashboardPage";
import QRCodePage from "../pages/main/book/QRCodePage";
import CreditCardPage from "../pages/main/Book/CreditCardPage";
import ReceiptPage from "../pages/main/Book/ReceiptPage";
import MyBookingList from "../pages/main/Book/BookingList";

/**
 * ถ้าอยากคุมด้วยโค้ดเองแทนใช้ AuthLayout
 * (สามารถสลับไปใช้ RequireAuth ด้านล่างแทนได้)
 */
// function RequireAuth({ children }) {
//   const user = JSON.parse(localStorage.getItem("user") || "null");
//   return user ? children : <Navigate to="/login" replace />;
// }

const AppRoutes = () => {
  return (
    <Routes>
      {/* ===== Main public area ===== */}
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="search-results" element={<SearchPage />} />

        {/* การจอง/การชำระเงิน (สาธารณะหรือกำหนดสิทธิ์แล้วแต่ระบบคุณ) */}
        <Route path="book" element={<BookPage />} />
        <Route path="qr-code" element={<QRCodePage />} />
        <Route path="credit-card" element={<CreditCardPage />} />
        <Route path="booking-list" element={<MyBookingList />} />

        <Route path="receipt" element={<ReceiptPage />} />
      </Route>

      {/* ===== Auth protected area =====
          ถ้า AuthLayout เช็กสิทธิ์อยู่แล้ว ให้ใส่เส้นทางที่ต้องล็อกอินไว้ภายในนี้ */}
      <Route element={<AuthLayout />}>
        <Route path="my-bookings" element={<MyBookingPage />} />
        <Route path="account" element={<AccountPage />} />{" "}
        {/* ⬅️ โปรไฟล์ของฉัน */}
      </Route>

      {/* ===== Admin area ===== */}
      <Route path="admin/*" element={<AdminLayout />}>
        <Route path="dashboard" element={<DashboardPage />} />
      </Route>

      {/* ===== Fallback ===== */}
      <Route path="*" element={<Navigate to="/" replace />} />
      
    </Routes>
  );
};

export default AppRoutes;
