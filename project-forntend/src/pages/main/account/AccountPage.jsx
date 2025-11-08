// src/pages/main/account/AccountPage.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import UserService from "@/services/api/user.service";
import AuthService from "@/services/auth/auth.service";
import "./AccountPage.css";

const BASE = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");

export default function AccountPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const [form, setForm] = useState({ name: "", lastname: "", phone: "", email: "" });
  const [avatar, setAvatar] = useState("");         // path จาก BE (เช่น /uploads/avatars/xxx.jpg)
  const [preview, setPreview] = useState("");       // preview ชั่วคราว
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  // โหลดข้อมูลโปรไฟล์
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await UserService.getMe();
        if (!alive) return;
        setForm({
          name: data?.name || "",
          lastname: data?.lastname || "",
          phone: data?.phone || "",
          email: data?.email || "",
        });
        setAvatar(data?.avatar || "");
      } catch (e) {
        setError(e?.response?.data?.message || "โหลดโปรไฟล์ไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const onChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(""); setOk(""); setSaving(true);
    try {
      const { data } = await UserService.updateMe({
        name: form.name?.trim(),
        lastname: form.lastname?.trim(),
        phone: form.phone?.trim(),
        email: form.email?.trim(),
      });

      // อัปเดต user ใน localStorage เพื่อให้ Navbar เปลี่ยนด้วย
      const current = AuthService.getCurrentUser() || {};
      AuthService.setCurrentUser?.({ ...current, ...data });
      window.dispatchEvent(new Event("auth:changed"));

      setOk("บันทึกสำเร็จ");
    } catch (e) {
      setError(e?.response?.data?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }, [form]);

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setSavingAvatar(true);
    setError(""); setOk("");

    try {
      const { data } = await UserService.uploadAvatar(file);
      setAvatar(data?.avatar || "");
      // อัปเดต local user ให้ Navbar เห็นรูปใหม่
      const cur = AuthService.getCurrentUser() || {};
      AuthService.setCurrentUser?.({ ...cur, avatar: data?.avatar || "" });
      window.dispatchEvent(new Event("auth:changed"));
      setOk("อัปโหลดรูปโปรไฟล์สำเร็จ");
    } catch (e) {
      setError(e?.response?.data?.message || "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setSavingAvatar(false);
    }
  };

  if (loading) return <div className="page container py-4">กำลังโหลด...</div>;

  const avatarSrc =
    preview || (avatar ? (avatar.startsWith("http") ? avatar : `${BASE}${avatar}`) : "");

  return (
    <div className="page container py-4">
      <h1 className="mb-3">โปรไฟล์ของฉัน</h1>

      {/* รูปโปรไฟล์ */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <div className="avatar-box">
          {avatarSrc ? (
            <img src={avatarSrc} alt="avatar" className="avatar-img" />
          ) : (
            <div className="avatar-fallback">ไม่มีรูป</div>
          )}
        </div>

        <div>
          <label className="btn btn-outline-primary mb-0">
            เลือกรูปใหม่
            <input
              type="file"
              accept="image/*"
              onChange={onPickAvatar}
              style={{ display: "none" }}
            />
          </label>
          {savingAvatar && <span className="ms-2">กำลังอัปโหลด...</span>}
        </div>
      </div>

      <form className="profile-form" onSubmit={onSubmit}>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">ชื่อ</label>
            <input className="form-control" name="name" value={form.name} onChange={onChange} />
          </div>
          <div className="col-md-6">
            <label className="form-label">นามสกุล</label>
            <input className="form-control" name="lastname" value={form.lastname} onChange={onChange} />
          </div>
          <div className="col-md-6">
            <label className="form-label">เบอร์โทร</label>
            <input className="form-control" name="phone" value={form.phone} onChange={onChange} />
          </div>
          <div className="col-md-6">
            <label className="form-label">อีเมล</label>
            <input type="email" className="form-control" name="email" value={form.email} onChange={onChange} />
          </div>
        </div>

        {error && <div className="alert alert-danger mt-3">{error}</div>}
        {ok && <div className="alert alert-success mt-3">{ok}</div>}

        <div className="mt-3 d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            ย้อนกลับ
          </button>
        </div>
      </form>
    </div>
  );
}
