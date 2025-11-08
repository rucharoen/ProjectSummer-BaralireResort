// src/components/01-heroimage/HeroImage.jsx
import { useEffect, useState, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./HeroImage.css";

// 👉 axios instance ของคุณ (ดูว่าไฟล์ตรง path นี้จริง)
import api from "@/services/http";

const BASE = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
const FALLBACK_PATH = "/uploads/site-assets/hero-barali.png"; // เปลี่ยนเป็นไฟล์ fallback ที่มีจริง

// รวม URL ให้ถูกต้องตามค่าที่ส่งมา
const resolveSrc = (value) => {
  if (!value) return `${BASE}${FALLBACK_PATH}`;
  if (value.startsWith("http")) return value;               // URL ภายนอก
  if (value.startsWith("/uploads")) return `${BASE}${value}`; // path จาก backend
  return `${BASE}/uploads/site-assets/${value}`;            // ไฟล์เนมล้วน
};

export default function HeroImage({
  // ถ้า parent ส่ง src มา จะใช้ค่านั้น; ถ้าไม่ส่ง จะดึงจาก API เอง
  src,
  alt = "ภาพด้านหน้ารีสอร์ท",
  title1 = "ยินดีต้อนรับเข้าสู่",
  title2 = "บาราลี บีช รีสอร์ท",
  priority = true,
}) {
  const [autoSrc, setAutoSrc] = useState("");     // src ที่ได้จาก API
  const [loadingData, setLoadingData] = useState(!src);
  const [error, setError] = useState("");

  // ดึงฮีโร่ล่าสุดจากฐานข้อมูลเมื่อไม่มี src ที่ส่งเข้ามา
  useEffect(() => {
    let alive = true;
    if (src) return; // มี src แล้วข้ามการเรียก API

    (async () => {
      try {
        setLoadingData(true);
        const { data } = await api.get("/api/site-assets/latest/hero");
        // data.url อาจเป็นชื่อไฟล์ เช่น "hero-barali.png" หรือเป็น "/uploads/site-assets/hero.jpg"
        const resolved = resolveSrc(data?.url || "");
        if (alive) setAutoSrc(resolved);
      } catch (e) {
        if (alive) setError(e?.response?.data?.message || e.message || "โหลดฮีโร่ไม่สำเร็จ");
      } finally {
        if (alive) setLoadingData(false);
      }
    })();

    return () => { alive = false; };
  }, [src]);

  // ตัดสินใจ src สุดท้าย
  const finalSrc = useMemo(() => resolveSrc(src || autoSrc), [src, autoSrc]);
  const imgLoading = priority ? "eager" : "lazy";

  // debug ช่วยตรวจ URL ที่กำลังโหลด
  console.log("[HeroImage] finalSrc =", finalSrc, { loadingData, error });

  return (
    <section id="bookingSection" className="hero w-100" aria-labelledby="hero-title">
      <div className="container">
        <figure className="hero__figure rounded-4 overflow-hidden m-0 position-relative">

          {/* Loader บางๆ ระหว่างโหลด API */}
          {loadingData && (
            <div
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{ background: "rgba(0,0,0,.04)" }}
              aria-hidden="true"
            />
          )}

          <picture>
            <source media="(max-width: 576px)" srcSet={finalSrc} sizes="100vw" />
            <img
              className="hero__img d-block"
              src={finalSrc}
              alt={alt}
              loading={imgLoading}
              decoding="async"
              fetchPriority={priority ? "high" : "auto"}
              draggable="false"
              width="1600"
              height="900"
              style={{ width: "100%", height: "56.25vw", maxHeight: "70vh", objectFit: "cover" }}
              onError={(e) => { e.currentTarget.src = `${BASE}${FALLBACK_PATH}`; }}
            />
          </picture>

          <span className="hero__overlay" aria-hidden="true" />

          <figcaption className="hero__content text-white text-center">
            <h1 id="hero-title" className="hero__title d-none d-md-block">{title1}</h1>
            <h2 className="hero__subtitle d-none d-md-block">{title2}</h2>

            {/* มือถือ */}
            <h1 className="hero__title--sm d-md-none">{title1}</h1>
            <h2 className="hero__subtitle--sm d-md-none">{title2}</h2>

            {/* แจ้ง error เบาๆ (เฉพาะตอน dev) */}
            {error && (
              <small style={{ display: "block", opacity: 0.6, marginTop: 8 }}>
                {error}
              </small>
            )}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
