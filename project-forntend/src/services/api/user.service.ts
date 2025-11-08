// src/services/api/user.service.ts
import api from "../http";

const UserService = {
  getMe() {
    return api.get("/api/users/me");
  },
  updateMe(payload: { name?: string; lastname?: string; phone?: string; email?: string }) {
    return api.patch("/api/users/me", payload);
  },
  // ✅ อัปโหลดรูป
  uploadAvatar(file: File) {
    const fd = new FormData();
    fd.append("avatar", file);
    return api.post("/api/users/me/avatar", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default UserService;
