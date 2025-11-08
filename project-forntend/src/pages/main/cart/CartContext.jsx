// src/pages/main/cart/CartContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useState,
  useRef,
} from "react";
import api, { getStoredToken } from "@/services/http";
import AuthService from "@/services/auth/auth.service";

const GUEST_KEY = "guest_cart_v1";
const userKey = (id) => `user_cart_${id}_v1`; // backup ต่อ "บัญชี"

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const user = AuthService.getCurrentUser();
  const last401Ref = useRef(0); // กัน log/รีเควสถี่ ๆ เมื่อ 401

  // ================= Helpers =================
  const calcCount = (arr) => arr.reduce((n, it) => n + (Number(it.qty) || 0), 0);
  const count = useMemo(() => calcCount(items), [items]);

  const hasToken = () => !!getStoredToken();

  // ------- Guest store (ไม่ล็อกอิน) -------
  const loadGuest = () => {
    try {
      return JSON.parse(localStorage.getItem(GUEST_KEY) || "[]");
    } catch {
      return [];
    }
  };
  const saveGuest = (arr) => localStorage.setItem(GUEST_KEY, JSON.stringify(arr));
  const clearGuest = () => localStorage.removeItem(GUEST_KEY);

  // ------- Per-user backup (ล็อกอิน) -------
  const loadUserBackup = (uid) => {
    if (!uid) return [];
    try {
      return JSON.parse(localStorage.getItem(userKey(uid)) || "[]");
    } catch {
      return [];
    }
  };
  const saveUserBackup = (uid, arr) => {
    if (!uid) return;
    localStorage.setItem(userKey(uid), JSON.stringify(arr));
  };
  const clearUserBackup = (uid) => uid && localStorage.removeItem(userKey(uid));

  // ------- Server store (API) -------
  const fetchServer = async () => {
    if (!hasToken()) {
      const e = new Error("No auth token");
      e.status = 401;
      throw e;
    }
    const { data } = await api.get("/api/cart"); // => { items: [...] }
    return data?.items || [];
  };

  const pushServer = async (arr) => {
    if (!hasToken()) return; // ไม่มีโทเคนก็ไม่อัป
    await api.put("/api/cart", { items: arr }); // บันทึกทั้งชุด
  };

  const clearServer = async () => {
    if (!hasToken()) return;
    await api.delete("/api/cart");
  };

  // ================= Public API =================
  const add = useCallback((item, qty = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === item.id);
      const next = [...prev];
      if (i === -1) next.push({ ...item, qty });
      else next[i] = { ...next[i], qty: (Number(next[i].qty) || 0) + qty };
      return next;
    });
  }, []);

  const remove = useCallback((id) => setItems((prev) => prev.filter((x) => x.id !== id)), []);
  const updateQty = useCallback(
    (id, qty) => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, qty } : x))),
    []
  );
  const clearLocalOnly = useCallback(() => setItems([]), []);

  // ทุกครั้งที่ items เปลี่ยน → บันทึก
  useEffect(() => {
    const u = AuthService.getCurrentUser();
    if (!u || !hasToken()) {
      saveGuest(items);
    } else {
      // 1) เก็บ backup รายบัญชีไว้เสมอ
      saveUserBackup(u.id, items);
      // 2) พยายาม sync ขึ้น server (ดีเลย์เล็กน้อยกัน spam)
      const t = setTimeout(() => {
        pushServer(items).catch((err) => {
          const code = err?.response?.status || err?.status;
          const now = Date.now();
          if (code === 401 && now - last401Ref.current < 3000) return;
          if (code === 401) last401Ref.current = now;
          console.warn("[Cart] pushServer failed:", code, err?.message);
        });
      }, 150);
      return () => clearTimeout(t);
    }
  }, [items]);

  // ================= Hydration / Merge =================
  /**
   * - guest: โหลดจาก localStorage
   * - user: ดึงจาก server; ถ้า server ว่าง/ดึงไม่สำเร็จ → ใช้ backup รายบัญชี
   *   และพยายาม push ขึ้น server ต่อให้สำเร็จภายหลัง
   * - มี guest ค้าง → merge กับของบัญชี (บวกจำนวน) แล้ว push ขึ้น server จากนั้นล้าง guest
   */
  const ensureReadyForUser = useCallback(async (u) => {
    const currUser = u || AuthService.getCurrentUser();

    // ไม่ล็อกอิน → ใช้ guest
    if (!currUser) {
      setItems(loadGuest());
      return;
    }

    // ล็อกอินแล้วแต่ไม่มีโทเคน (edge case) → ใช้ backup/guest เท่าที่มี
    if (!hasToken()) {
      const backup = loadUserBackup(currUser.id);
      const guestItems = loadGuest();
      const merged =
        guestItems?.length || backup?.length
          ? mergeByIdSumQty(backup, guestItems)
          : [];
      saveUserBackup(currUser.id, merged);
      clearGuest();
      setItems(merged);
      return;
    }

    try {
      let serverItems = [];
      try {
        serverItems = await fetchServer();
      } catch (e) {
        const code = e?.response?.status || e?.status;
        const now = Date.now();
        if (code === 401 && now - last401Ref.current >= 3000) {
          last401Ref.current = now;
          console.warn("[Cart] fetchServer failed, fallback to user backup:", e?.message);
        }
      }

      // ถ้า server ไม่มีของ ลองใช้ backup รายบัญชี
      if (!serverItems?.length) {
        const backup = loadUserBackup(currUser.id);
        if (backup?.length) {
          serverItems = backup;
          // พยายาม sync ขึ้นเซิร์ฟเวอร์
          pushServer(backup).catch((err) =>
            console.warn("[Cart] pushServer(from backup) failed:", err?.message)
          );
        }
      }

      // รวมกับ guest (ถ้ามี)
      const guestItems = loadGuest();
      let merged = serverItems || [];
      if (guestItems?.length) {
        merged = mergeByIdSumQty(serverItems, guestItems);
        // อัปขึ้น server และอัปเดต backup รายบัญชี
        pushServer(merged).catch((err) =>
          console.warn("[Cart] pushServer(merged) failed:", err?.message)
        );
        saveUserBackup(currUser.id, merged);
        clearGuest();
      }

      setItems(merged);
    } catch (e) {
      console.warn("[Cart] ensureReadyForUser unexpected:", e?.message);
      // อย่างน้อยให้มีของจาก backup หรือ guest
      const fallback = loadUserBackup(currUser.id);
      setItems(fallback?.length ? fallback : []);
    }
  }, []);

  // helper รวมรายการด้วย id และบวก qty
  const mergeByIdSumQty = (a = [], b = []) => {
    const map = new Map();
    for (const it of a || []) map.set(it.id, { ...it });
    for (const it of b || []) {
      const ex = map.get(it.id);
      if (!ex) map.set(it.id, { ...it });
      else map.set(it.id, { ...ex, qty: (Number(ex.qty) || 0) + (Number(it.qty) || 0) });
    }
    return [...map.values()];
  };

  // ครั้งแรกของแอป
  useEffect(() => {
    ensureReadyForUser(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
  const handler = () => {
    // ปิดซิงก์ server และใช้ guest/backup ต่อ
    // ถ้ามี state serverSyncEnabled อยู่แล้ว ก็ set(false) ได้
    // หรือเรียก ensureReadyForUser(null) เพื่อสลับเป็น guest
    // ตัวอย่าง:
    if (typeof setServerSyncEnabled === "function") setServerSyncEnabled(false);
  };
  window.addEventListener("auth:expired", handler);
  return () => window.removeEventListener("auth:expired", handler);
}, []);
  const value = {
    items,
    count,
    add,
    remove,
    updateQty,
    ensureReadyForUser,
    clearLocalOnly,
    clearServer,
    fetchServer,
    pushServer,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
