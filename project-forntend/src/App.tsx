// src/App.tsx
import React from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";

import AuthService from "./services/auth/auth.service";
import AuthProvider from "./pages/auth/AuthContext";
import { CartProvider } from "./pages/main/cart/CartContext";

AuthService.primeAxiosAuthHeader();

export default function App() {
  return (
    <BrowserRouter>
      {/* Provider ทั้งระบบแอป */}
      <AuthProvider>
        <CartProvider>
          {/* ไฟล์รวม Route ของคุณ */}
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
