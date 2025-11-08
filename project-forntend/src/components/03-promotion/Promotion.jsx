// src/components/promotion/Promotion.jsx
import { useEffect, useMemo, useState } from "react";
import AccommodationService from "../../services/api/accommodation/accommodation.service";
import PromotionCard from "./PromotionCard";
import { Spinner, Alert } from "react-bootstrap";
import dayjs from "dayjs";
import "./Promotion.css";

const API_BASE = import.meta.env.VITE_BASE_URL ?? "";

/* ช่วยแปลงค่าเปอร์เซ็นต์ให้เป็น number แม้มาเป็นสตริง "55", "55 %" */
function toPercentNumber(val) {
  if (val == null) return 0;
  const n = Number(String(val).replace(/[^0-9.]+/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** รวมข้อมูลโปรโมชันกับห้อง */
function mergePromoWithAccommodation(bestRows = [], accommodations = []) {
  const accById = new Map(accommodations.map((a) => [a.id, a]));

  return bestRows.map((row) => {
    const acc = accById.get(row.accommodation_id) || {};
    const typeName = row.room_type || acc?.type?.name || "";
    const images = Array.isArray(acc.images) ? acc.images : [];

    // รองรับหลายชื่อคีย์ที่ BE อาจส่งมา
    const percent =
      row.promo_percent ??
      row.discount_percent ??
      row.percent ??
      row.promoPercent ??
      row.discountPercent ??
      0;

    return {
      id: row.accommodation_id,
      name: acc?.name || row.accommodation_name || "ห้องพัก",
      image_name: acc?.image_name || "",
      images,

      type: { id: row.room_type_id, name: typeName },

      base_price: Number(row.base_price ?? 0),
      final_price: Number(row.final_price ?? row.base_price ?? 0),

      // แปลงเป็นตัวเลขแน่นอน
      discount_percent: toPercentNumber(percent),

      best_promo: {
        id: row.promo_id,
        // เผื่อบาง view ส่งเป็นชื่ออื่น
        condition: row.promo_condition || row.condition || "",
        period: [row.start_at, row.end_at], // ISO ก็ได้
      },

      highlight: row.promo_condition || row.condition || "โปรพิเศษ มีเวลาจำกัด",
      includes_breakfast: true,
    };
  });
}

export default function Promotion() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const accRes = await AccommodationService.getAll();
        const accommodations = Array.isArray(accRes?.data) ? accRes.data : [];

        const resp = await fetch(`${API_BASE}/api/promo/best`, {
          headers: { "Content-Type": "application/json" },
        });
        if (!resp.ok) {
          const t = await resp.text();
          throw new Error(`HTTP ${resp.status} - ${t}`);
        }
        const bestRows = await resp.json();

        // 👀 debug 1 แถว เพื่อดูคีย์จริงว่า BE ส่งอะไรมา
        if (bestRows?.length) console.log("promo/best sample row:", bestRows[0]);

        const merged = mergePromoWithAccommodation(bestRows || [], accommodations);
        if (!mounted) return;

        if (!merged.length) {
          const fallback = accommodations.slice(0, 3).map((acc) => ({
            ...acc,
            type: acc?.type || {},
            final_price: acc?.base_price ?? 0,
            discount_percent: 0,
            best_promo: null,
            highlight: "โปรพิเศษ มีเวลาจำกัด",
            includes_breakfast: true,
          }));
          setItems(fallback);
        } else {
          setItems(merged);
        }
      } catch (e) {
        console.error("Fetch promotions failed:", e);
        setErr("เกิดข้อผิดพลาดในการโหลดโปรโมชัน");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const topThree = useMemo(() => items.slice(0, 3), [items]);

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="my-4">
        <Alert variant="danger" className="text-center">
          {err}
        </Alert>
      </div>
    );
  }

  if (!topThree.length) {
    return (
      <div className="text-center my-4">
        <p className="text-muted">ยังไม่มีรายการโปรโมชัน</p>
      </div>
    );
  }

  const handleScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const width = e.target.clientWidth;
    const index = Math.round(scrollLeft / width);
    setActiveIndex(index);
  };

  return (
    <div className="promotion-wrapper">
      <div className="promotion-row" onScroll={handleScroll}>
        {topThree.map((acc) => (
          <PromotionCard key={`${acc.id}-${acc.best_promo?.id ?? "nopromo"}`} accommodation={acc} />
        ))}
      </div>

      <div className="promotion-dots">
        {topThree.map((_, i) => (
          <span key={i} className={`dot ${activeIndex === i ? "active" : ""}`} />
        ))}
      </div>
    </div>
  );
}
