// src/components/layouts/MainNavbar.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./MainNavbar.css";

import { ShoppingCart, ChevronDown, UserRound, LogOut } from "lucide-react";
import AuthService from "../../services/auth/auth.service";
import LoginPage from "../../pages/main/login/LoginPage";
import { useCart } from "../../pages/main/cart/CartContext";
import CartDialog from "../../pages/main/cart/CartDialog";

// 👉 axios instance ที่มี baseURL = VITE_BASE_URL
import api from "@/services/http";

const MENUS = [
  { label: "หน้าแรก", action: "home" },
  { label: "โปรโมชัน", targetId: "PromotionSection" },
  { label: "ประเภทห้องพัก", targetId: "PopularSection" },
  { label: "กิจกรรม", targetId: "ActivitySection" },
  { label: "ติดต่อเรา", targetId: "Contact" },
];

const BASE = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
const FALLBACK_LOGO = "/uploads/site-assets/logo-barali.png"; // ให้ไฟล์นี้มีจริงที่ BE

const resolveAssetUrl = (v) => {
  if (!v) return `${BASE}${FALLBACK_LOGO}`;
  if (v.startsWith("http")) return v;
  if (v.startsWith("/")) return `${BASE}${v}`;
  return `${BASE}/uploads/site-assets/${v}`;
};

// สร้าง URL รูป Avatar ของผู้ใช้ (ถ้ามี)
const resolveAvatarUrl = (u) => {
  const candidate =
    u?.avatar || u?.photo || u?.image_url || u?.image || u?.profileImage || "";
  if (!candidate) return null;
  if (candidate.startsWith("http")) return candidate;
  if (candidate.startsWith("/")) return `${BASE}${candidate}`;
  return `${BASE}/uploads/${candidate}`;
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState(AuthService.getCurrentUser());

  // 👉 เมนูผู้ใช้ (ดรอปดาวน์)
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // 👉 รถเข็น (นับจำนวนจาก context)
  const { count, ensureReadyForUser, clearLocalOnly } = useCart();

  // 👉 โลโก้
  const [logoSrc, setLogoSrc] = useState(`${BASE}${FALLBACK_LOGO}`);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/api/site-assets/latest/logo");
        if (alive) setLogoSrc(resolveAssetUrl(data?.url));
      } catch (_) {}
    })();
    return () => (alive = false);
  }, []);

  // 👉 เปิดรถเข็น: ถ้าไม่ล็อกอินให้เปิดโมดัลล็อกอิน
  const openCart = () => {
    if (!user) { setIsLoginOpen(true); return; }
    setIsCartOpen(true);
  };

  // 👉 ปิด scroll เมื่อมี overlay
  useEffect(() => {
    const anyOverlay = open || isLoginOpen || isCartOpen;
    document.body.style.overflow = anyOverlay ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [open, isLoginOpen, isCartOpen]);

  // 👉 sync user/cart เมื่อ login/logout
  useEffect(() => {
    setUser(AuthService.getCurrentUser());
    ensureReadyForUser(AuthService.getCurrentUser()); // โหลด/merge รถเข็นให้ตรงกับบัญชี
    const onAuthChanged = () => {
      const u = AuthService.getCurrentUser();
      setUser(u);
      ensureReadyForUser(u);
    };
    const onStorage = (e) => {
      if (e.key === "user" || e.key === "token") onAuthChanged();
    };
    window.addEventListener("auth:changed", onAuthChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("auth:changed", onAuthChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, [ensureReadyForUser]);

  // ปิด user menu เมื่อคลิกนอก
  useEffect(() => {
    const onClickAway = (e) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    if (userMenuOpen) document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [userMenuOpen]);

  // 👉 ปุ่มเมนูเลื่อน
  const handleMenuClick = useCallback((m) => {
    setOpen(false);
    if (m.action === "home") { navigate("/"); return; }
    const el = m.targetId ? document.getElementById(m.targetId) : null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [navigate]);

  // 👉 ออกจากระบบ: ล้างรถเข็นในเครื่องทันที แต่ไม่ยุ่งกับรถเข็นบนเซิร์ฟเวอร์
  const logout = () => {
    AuthService.logout();
    clearLocalOnly();
    setUser(null);
    setOpen(false);
    setIsCartOpen(false);
    setUserMenuOpen(false);
    navigate("/", { replace: true });
  };

  const openLoginModal = useCallback(() => {
    setOpen(false);
    setIsLoginOpen(true);
  }, []);

  const displayName = user ? [user.name, user.lastname].filter(Boolean).join(" ") || user.email || "สมาชิก" : "";

  const avatarUrl = user ? resolveAvatarUrl(user) : null;

  return (
    <>
      <header className="main-navbar shadow-sm">
        <nav className="navbar navbar-expand-lg" aria-label="Primary">
          <div className="container navbar-inner">
            {/* โลโก้ */}
            <Link to="/" className="navbar-brand d-flex align-items-center gap-2">
              <img
                src={logoSrc}
                alt="Barali Resort"
                className="brand-logo"
                height={56}
                width={56}
                loading="eager"
                onError={(e) => { e.currentTarget.src = `${BASE}${FALLBACK_LOGO}`; }}
              />
            </Link>

            {/* Burger (mobile) */}
            <button
              className="navbar-toggler custom-burger"
              type="button"
              aria-controls="drawerLayer"
              aria-expanded={open}
              aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
              onClick={() => setOpen((v) => !v)}
            >
              {!open ? (
                <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>

            {/* เมนูหลัก (desktop) */}
            <ul className="navbar-nav primary-nav d-none d-lg-flex">
              {MENUS.map((m) => (
                <li key={m.label} className="nav-item">
                  <button type="button" className="nav-link nav-link-btn" onClick={() => handleMenuClick(m)}>
                    {m.label}
                  </button>
                </li>
              ))}
            </ul>

            {/* ด้านขวา (desktop) */}
            <div className="ms-auto d-none d-lg-flex align-items-center right-rail">
              {/* รถเข็น + badge */}
              <button
                type="button"
                className="btn btn-cart position-relative me-2 cart-btn-wrap"
                onClick={openCart}
                aria-label="รถเข็น"
              >
                <ShoppingCart size={26} strokeWidth={1.8} />
                {count > 0 && <span className="cart-badge" aria-label={`มี ${count} รายการ`}>{count}</span>}
              </button>

              {/* ชิปภาษา/สกุลเงิน */}
              <div className="lang-chip me-2" role="button" tabIndex={0}>
                <img
                  src="https://flagcdn.com/w20/th.png"
                  alt="TH"
                  width={20}
                  height={14}
                  className="flag"
                  loading="lazy"
                />
                <span className="lang-text">TH/THB</span>
              </div>

              {/* ผู้ใช้: avatar + ชื่อ + เมนูยอดนิยม */}
              {!user ? (
                <button type="button" className="btn btn-login" onClick={openLoginModal}>
                  เข้าสู่ระบบ
                </button>
              ) : (
                <div className="user-chip-wrap" ref={userMenuRef}>
                  <button
                    type="button"
                    className="user-chip"
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    onClick={() => setUserMenuOpen((v) => !v)}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="avatar" className="user-avatar" onError={(e)=>{e.currentTarget.style.display='none';}} />
                    ) : (
                      <span className="user-avatar user-avatar-fallback" aria-hidden>
                        <UserRound size={18} />
                      </span>
                    )}
                    <span className="user-name" title={displayName}>{displayName}</span>
                    <ChevronDown size={16} className="chev" aria-hidden />
                  </button>

                  {userMenuOpen && (
                    <div className="user-menu" role="menu">
                      <button className="user-menu-item" role="menuitem" onClick={() => { setUserMenuOpen(false); navigate("/account"); }}>
                        <UserRound size={16} />
                        โปรไฟล์ของฉัน
                      </button>
                      <button className="user-menu-item" role="menuitem" onClick={() => { setUserMenuOpen(false); navigate("/my-bookings"); }}>
                        <i className="bi bi-journal-check" />
                        การจองของฉัน
                      </button>
                      <div className="user-menu-sep" />
                      <button className="user-menu-item danger" role="menuitem" onClick={logout}>
                        <LogOut size={16} />
                        ออกจากระบบ
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Drawer มือถือ */}
        <div id="drawerLayer" className={`drawer-layer d-lg-none ${open ? "is-open" : ""}`}>
          <button className="drawer-backdrop" aria-hidden="true" tabIndex={-1} onClick={() => setOpen(false)} />
          <aside className={`drawer ${open ? "slide-in" : "slide-out"}`} role="dialog" aria-modal="true">
            {!user ? (
              <button type="button" className="btn btn-login btn-mobile-full" onClick={openLoginModal}>
                เข้าสู่ระบบ
              </button>
            ) : (
              <>
                {/* ส่วนหัวผู้ใช้ใน Drawer */}
                <div className="drawer-user">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="drawer-avatar" />
                  ) : (
                    <span className="drawer-avatar drawer-avatar-fallback"><UserRound size={24} /></span>
                  )}
                  <div className="drawer-user-meta">
                    <div className="drawer-user-name" title={displayName}>{displayName}</div>
                    <div className="drawer-user-role">สมาชิก</div>
                  </div>
                </div>

                <div className="drawer-actions">
                  <button className="drawer-action" onClick={() => { setOpen(false); navigate("/account"); }}>
                    <UserRound size={16} /> โปรไฟล์ของฉัน
                  </button>
                  <button className="drawer-action" onClick={() => { setOpen(false); navigate("/my-bookings"); }}>
                    <i className="bi bi-journal-check" /> การจองของฉัน
                  </button>
                  <button className="drawer-action danger" onClick={logout}>
                    <LogOut size={16} /> ออกจากระบบ
                  </button>
                </div>
              </>
            )}

            <ul className="drawer-menu">
              {MENUS.map((m) => (
                <li key={m.label}>
                  <button type="button" className="drawer-link" onClick={() => handleMenuClick(m)}>
                    {m.label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="drawer-lang-row">
              <span className="drawer-lang-label">ภาษา</span>
              <div className="lang-chip mobile">
                <img src="https://flagcdn.com/w20/th.png" alt="TH" width={20} height={14} className="flag" />
                <span className="lang-text">TH/THB</span>
              </div>
            </div>
          </aside>
        </div>
      </header>

      {/* ป็อปอัปรถเข็น */}
      <CartDialog open={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* โมดัลล็อกอิน */}
      {isLoginOpen && <LoginPage closeLogin={() => setIsLoginOpen(false)} />}
    </>
  );
}
