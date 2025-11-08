// src/pages/main/login/LoginPage.jsx
import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "../../../pages/auth/AuthContext";
import "./loginPage.css";
import api from "@/services/http";

/** แปลง error จาก axios เป็นข้อความอ่านง่าย */
function formatLoginError(error) {
  if (error?.code === "ERR_NETWORK") {
    return "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (Network/CORS) กรุณาตรวจสอบการเชื่อมต่อหรือค่า BASE_URL";
  }
  const status = error?.response?.status;
  const data = error?.response?.data;
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  if (data?.errors && typeof data.errors === "object") {
    const first = Object.values(data.errors).find(Boolean);
    if (typeof first === "string") return first;
  }
  switch (status) {
    case 400: return "ข้อมูลไม่ถูกต้องหรือไม่ครบถ้วน กรุณาตรวจสอบอีกครั้ง";
    case 401: return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    case 403: return "บัญชีนี้ไม่มีสิทธิ์เข้าถึงระบบ";
    case 404: return "ไม่พบเส้นทาง /auth/login ที่ฝั่งเซิร์ฟเวอร์ (โปรดตรวจสอบ URL)";
    case 422: return "รูปแบบข้อมูลไม่ผ่านการตรวจสอบ (Validation)";
    case 500: return "เกิดข้อผิดพลาดที่ฝั่งเซิร์ฟเวอร์ (500) กรุณาลองใหม่ภายหลัง";
    default:  return "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง";
  }
}

const BASE = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
const FALLBACK_LOGO = "/uploads/site-assets/logo-barali.png";
const resolveAssetUrl = (v) => {
  if (!v) return `${BASE}${FALLBACK_LOGO}`;
  if (v.startsWith("http")) return v;
  if (v.startsWith("/uploads")) return `${BASE}${v}`;
  return `${BASE}/uploads/site-assets/${v}`;
};

const LoginPage = ({ closeLogin }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // ---------- State (ต้องมีและต้องอยู่ก่อนการใช้งานทั้งหมด) ----------
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loginError, setLoginError] = useState("");     // ← เพิ่ม/ย้ายให้ประกาศแน่นอน
  const [showToast, setShowToast] = useState(false);
  const [logoSrc, setLogoSrc] = useState(`${BASE}${FALLBACK_LOGO}`);

  const toastTimerRef = useRef(null);

  // โหลดโลโก้จาก BE
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/api/site-assets/latest/logo");
        const src = resolveAssetUrl(data?.url);
        if (alive) setLogoSrc(src);
      } catch {/* ใช้ fallback */}
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    document.title = "เข้าสู่ระบบ | บาราลี รีสอร์ท เกาะช้าง";
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const patterns = useMemo(
    () => ({ email: /\S+@\S+\.\S+/, thaiChars: /[\u0E00-\u0E7F]/ }),
    []
  );

  const validate = useCallback(({ email: e, password: p }) => {
    const next = {};
    if (!e) next.email = "กรุณากรอกอีเมล";
    else if (!patterns.email.test(e)) next.email = "รูปแบบอีเมลไม่ถูกต้อง";
    else if (patterns.thaiChars.test(e)) next.email = "อีเมลต้องไม่ประกอบด้วยอักษรภาษาไทย";
    if (!p) next.password = "กรุณากรอกรหัสผ่าน";
    return next;
  }, [patterns]);

  const toggleShowPassword = useCallback(() => setShowPassword((s) => !s), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    const nextErrors = validate({ email, password });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsLoading(true);
    setLoginError("");

    try {
      await login(email.trim(), password);
      setShowToast(true);
      toastTimerRef.current = setTimeout(() => {
        setShowToast(false);
        closeLogin?.();
        navigate("/", { replace: true });
      }, 1500);
    } catch (error) {
      setLoginError(formatLoginError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const emailErrorId = errors.email ? "email-error" : undefined;
  const passwordErrorId = errors.password ? "password-error" : undefined;

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="login-modal-title"
           style={{ position: "fixed", inset: 0, background: "rgba(112,112,112,0.3)", zIndex: 2000 }}>
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content border-0 rounded-3 p-2">
            <button type="button" className="btn-close position-absolute end-0 m-3 z-3" onClick={closeLogin} aria-label="Close" />

            <div className="modal-body text-center" style={{ padding: "2rem", backgroundColor: "#fff", borderRadius: "0.75rem", lineHeight: 1.6 }}>
              <img
                src={logoSrc}
                alt="Barali Resort Koh Chang logo"
                width="113"
                height="88"
                className="mb-3"
                onError={(e) => { e.currentTarget.src = `${BASE}${FALLBACK_LOGO}`; }}
              />

              <h5 id="login-modal-title" className="fw-bold mb-3">เข้าสู่ระบบ</h5>
              <p className="mb-4" style={{ color: "rgba(91, 91, 91, 1)" }}>กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ</p>

              {loginError && (
                <div className="alert alert-danger alert-dismissible fade show text-start" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2" aria-hidden="true" />
                  <span>{loginError}</span>
                  <button type="button" className="btn-close" onClick={() => setLoginError("")} aria-label="Close alert" />
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Email */}
                <div className="mb-3 text-start">
                  <label htmlFor="email" className="form-label fw-semibold">อีเมล</label>
                  <input
                    type="email"
                    id="email"
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={emailErrorId}
                    inputMode="email"
                    autoComplete="username"
                    spellCheck={false}
                    style={{ border: "2px solid rgba(184, 179, 179, 1)" }}
                  />
                  {errors.email && <div id="email-error" className="invalid-feedback">{errors.email}</div>}
                </div>

                {/* Password */}
                <div className="mb-3 text-start">
                  <label htmlFor="password" className="form-label fw-semibold">รหัสผ่าน</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      className={`form-control ${errors.password ? "is-invalid" : ""}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={passwordErrorId}
                      autoComplete="current-password"
                      style={{ border: "2px solid rgba(184, 179, 179, 1)", borderRight: "none" }}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={toggleShowPassword}
                      aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                      aria-pressed={showPassword}
                      style={{ border: "2px solid rgba(184, 179, 179, 1)", borderLeft: "none" }}
                    >
                      <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
                    </button>
                  </div>
                  {errors.password && <div id="password-error" className="invalid-feedback d-block">{errors.password}</div>}
                </div>

                <button
                  type="submit"
                  className="w-100 mb-3 d-inline-flex align-items-center justify-content-center"
                  disabled={isLoading}
                  style={{ backgroundColor: "rgba(0,186,242,1)", borderColor: "rgba(0,186,242,1)", color: "#fff",
                           fontWeight: 500, fontSize: "1rem", padding: "0.5rem 1rem", borderRadius: "0.375rem",
                           border: "1px solid transparent", marginTop: 18, minHeight: 44 }}
                >
                  {isLoading ? (<><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />กำลังเข้าสู่ระบบ...</>)
                             : (<>เข้าสู่ระบบ</>)}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1100 }}>
          <div className="toast show align-items-center text-white bg-success border-0" role="status" aria-live="polite" aria-atomic="true">
            <div className="d-flex">
              <div className="toast-body">
                <i className="bi bi-check-circle-fill me-2" aria-hidden="true" />
                เข้าสู่ระบบสำเร็จ! กำลังนำคุณไปยังหน้าหลัก...
              </div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" aria-label="Close" onClick={() => setShowToast(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

LoginPage.propTypes = { closeLogin: PropTypes.func };
export default LoginPage;
