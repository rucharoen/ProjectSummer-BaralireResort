// src/services/auth/auth.service.js
import api, { setAuthToken } from "../http";

const USER_KEY = "user";
const TOKEN_KEY = "token";

const AuthService = {
  /**
   * เข้าสู่ระบบ
   */
  async login(email, password) {
    const { data } = await api.post("/api/auth/signin", { email, password });

    if (data?.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    if (data?.accessToken) {
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      setAuthToken(data.accessToken); // ติด Authorization ให้ axios
    }

    // แจ้งคอมโพเนนต์อื่น ๆ
    window.dispatchEvent(new Event("auth:changed"));
    return data?.user;
  },

  /**
   * ออกจากระบบ
   */
  logout() {
    // เรียก BE ถ้ามี endpoint; ถ้าไม่มีจะเงียบ ๆ
    api.post("/api/auth/logout").catch(() => {});

    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);

    window.dispatchEvent(new Event("auth:changed"));
  },

  /**
   * ผู้ใช้ปัจจุบันจาก localStorage
   */
  getCurrentUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * ตั้ง/อัปเดตข้อมูลผู้ใช้ใน localStorage (เช่น หลังแก้โปรไฟล์)
   */
  setCurrentUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event("auth:changed"));
  },

  /**
   * เรียกตอนบูตแอป: เอา token เดิมมาตั้ง header ให้ axios
   */
  primeAxiosAuthHeader() {
    const token =
      localStorage.getItem(TOKEN_KEY) ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");
    setAuthToken(token);
  },
};

export default AuthService;
