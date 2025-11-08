// src/components/promotion/PromotionCard.jsx
import Col from "react-bootstrap/Col";
import { useNavigate } from "react-router-dom";
import "./PromotionCard.css";
import { goToSearchResults } from "@/utils/searchNav";
import dayjs from "dayjs";

const BASE_URL = import.meta.env.VITE_BASE_URL ?? "";

// ⬇️ helper: แปลงค่าใด ๆ ให้เป็นตัวเลขเปอร์เซ็นต์
function toPercentNumber(val) {
  if (val == null) return 0;
  // รองรับทั้ง number และ string เช่น "55", "55 %", "55.0"
  const n = Number(String(val).replace(/[^0-9.]+/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export default function PromotionCard({ accommodation = {}, checkIn, checkOut }) {
  const navigate = useNavigate();

  // รูปภาพ
  const images = Array.isArray(accommodation.images) ? accommodation.images : [];
  const imagesToShow = images.slice(0, 3);

  // ⬇️ ดึงส่วนลดจากหลายชื่อฟิลด์ที่เป็นไปได้
  const discountPercent = toPercentNumber(
    accommodation.discount_percent ??
      accommodation.promo_percent ??
      accommodation.percent ??
      accommodation.best_promo?.percent
  );

  const basePrice = Number(accommodation.base_price ?? 0) || 0;
  const finalPrice =
    Number(accommodation.final_price) ||
    (basePrice && discountPercent ? basePrice * (1 - discountPercent / 100) : basePrice);

  const promo = accommodation.best_promo || null;

  const periodText =
    Array.isArray(promo?.period) && promo.period.length === 2
      ? `${dayjs(promo.period[0]).format("D MMM YYYY")} - ${dayjs(promo.period[1]).format("D MMM YYYY")}`
      : accommodation.period || "—";

  const handleBookingClick = () => {
    const today = new Date();
    const tomorrow = dayjs(today).add(1, "day").toDate();
    goToSearchResults(navigate, {
      destination: accommodation?.type?.name || "",
      checkIn: checkIn || today,
      checkOut: checkOut || tomorrow,
      rooms: 1,
      adults: 1,
      children: 0,
      guests: 1,
      promoId: promo?.id,
    });
  };

  return (
    <Col xs={12} sm={6} md={4} className="d-flex justify-content-center mb-4 mt-4 g-1">
      <article className="promo-card">
        <div className="promo-card__media">
          {discountPercent > 0 && <div className="promo-badge">โปรโมชัน</div>}
          {imagesToShow.length ? (
            imagesToShow.map((img, idx) => (
              <img
                key={idx}
                src={`${BASE_URL}/uploads/accommodations/${img}`}
                alt={`${accommodation.name} ภาพที่ ${idx + 1}`}
                className={`promo-card__img ${idx === 0 ? "is-left" : idx === imagesToShow.length - 1 ? "is-right" : ""}`}
                style={{ width: `${100 / imagesToShow.length}%` }}
              />
            ))
          ) : (
            <img
              src={
                accommodation.image_name
                  ? `${BASE_URL}/uploads/accommodations/${accommodation.image_name}`
                  : `${BASE_URL}/placeholder.jpg`
              }
              alt={accommodation.name}
              className="promo-card__img is-single"
            />
          )}
        </div>

        <div className="promo-card__body">
          <h3 className="promo-card__title">{accommodation.name}</h3>
          <p className="promo-card__highlight">{accommodation.highlight || "มีเวลาจำกัด"}</p>
          <p className="promo-card__meta">{periodText}</p>

          {finalPrice > 0 && (
            <p className="promo-card__price-line">
              {discountPercent > 0 ? (
                <>
                  <span className="price-old">{basePrice.toLocaleString()}฿</span>{" "}
                  <span className="price-now">{finalPrice.toLocaleString()}฿</span>{" "}
                  <span className="badge-off">- {discountPercent}%</span>
                </>
              ) : (
                <span className="price-now">{finalPrice.toLocaleString()}฿</span>
              )}
              <span className="per-night"> / คืน</span>
            </p>
          )}

          {accommodation.includes_breakfast}
        </div>

        <div className="promo-card__footer">
          <span className="promo-card__save">
            {discountPercent > 0 ? `ประหยัด ${discountPercent} %` : "ราคาปกติ"}
          </span>
          <button type="button" className="promo-card__cta" onClick={handleBookingClick}>
            จองเลยตอนนี้
          </button>
        </div>
      </article>
    </Col>
  );
}
