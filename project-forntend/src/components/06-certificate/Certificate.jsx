import { useEffect, useState } from "react";
import api from "@/services/http";
import "./Certificate.css";

const BASE = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");

// แปลง url จาก DB → URL เต็มที่เปิดได้
const resolveUrl = (v) => {
  if (!v) return "";
  if (v.startsWith("http")) return v;
  if (v.startsWith("/uploads")) return `${BASE}${v}`;
  return `${BASE}/uploads/site-assets/${v}`;
};

export default function Certificate() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // ดึงเฉพาะ type=certificate ที่ active
        const { data } = await api.get("/api/site-assets", {
          params: { type: "certificate", active: 1 },
        });
        // map เป็น URL เต็ม
        const list = (data || []).map((it) => ({
          id: it.id,
          src: resolveUrl(it.url),
          alt: it.alt_text || it.title || "Certificate",
        }));
        if (alive) setItems(list);
      } catch (e) {
        console.debug("[Certificate] fetch error:", e?.message);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (!items.length) return null;

  return (
    <section className="certificate-section" aria-label="Certificates & Awards">
      <div className="container">
        <ul className="cert-list">
          {items.map((it) => (
            <li key={it.id} className="cert-item">
              <img
                src={it.src}
                alt={it.alt}
                loading="lazy"
                decoding="async"
                width="160"
                height="120"
                onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

