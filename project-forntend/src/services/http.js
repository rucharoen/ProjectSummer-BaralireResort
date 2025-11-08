// src/services/http.js
import axios from "axios";

const BASE = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
const api = axios.create({ baseURL: BASE, headers: { "Content-Type": "application/json" }, timeout: 15000 });

export const getStoredToken = () =>
  localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("access_token") || "";

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    api.defaults.headers.common["x-access-token"] = token;
  } else {
    delete api.defaults.headers.common.Authorization;
    delete api.defaults.headers.common["x-access-token"];
  }
};

api.interceptors.request.use((config) => {
  const t = getStoredToken();
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
    config.headers["x-access-token"] = t;
  }
  return config;
});

export const onAuthExpired = () => {
  // ล้าง token แล้วให้ส่วนอื่นรู้ว่าหมดอายุ
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("access_token");
  setAuthToken(null);
  window.dispatchEvent(new CustomEvent("auth:expired"));
};

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const reason = err.response?.data?.reason || err.response?.data?.message;
    if (status === 401 && String(reason).toLowerCase().includes("jwt expired")) {
      onAuthExpired();
    }
    return Promise.reject(err);
  }
);

export default api;
