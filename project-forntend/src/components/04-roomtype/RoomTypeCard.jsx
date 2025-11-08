import React, { memo, useCallback, useMemo, useState } from "react";
import "./RoomTypeCard.css";
import RoomDetailModal from "../02-search/RoomDetailModal";

const BASE_URL = import.meta.env.VITE_BASE_URL ?? "";
const PLACEHOLDER = "/placeholder.jpg";

/**
 * @typedef {{ id?: string|number, name?: string, image_name?: string, capacity?: number|null, images?: string[], description?: string, amenities?: string[], occupancy_text?: string, extra_bed_text?: string }} Accommodation
 * @typedef {{ accommodation?: Accommodation, onMore?: (acc: Accommodation) => void }} Props
 */
const RoomTypeCard = ({ accommodation = {}, onMore }) => {
  const { name, image_name, capacity } = accommodation;
  const [open, setOpen] = useState(false);

  const displayName = name?.trim() || "ชื่อห้องพัก";

  const imgSrc = useMemo(() => {
    if (image_name && BASE_URL) {
      return `${BASE_URL}/uploads/accommodations/${encodeURIComponent(image_name)}`;
    }
    return PLACEHOLDER;
  }, [image_name]);

  const handleImgError = useCallback(
    (e) => {
      const img = e.currentTarget;
      img.onerror = null;
      img.src = PLACEHOLDER;
      img.alt = `${displayName} (ไม่มีภาพ)`;
    },
    [displayName]
  );

  const handleMore = useCallback(() => {
    onMore?.(accommodation);   // ถ้ามี callback ภายนอก
    setOpen(true);             // เปิดป็อปอัป
  }, [onMore, accommodation]);

  const capacityText = Number.isFinite(capacity) ? `ขนาด: ${capacity} ตร.ม.` : "ขนาด: - ตร.ม.";

  return (
    <>
      <article className="room-card">
        <figure className="room-media">
          <img
            src={imgSrc}
            alt={displayName}
            loading="lazy"
            decoding="async"
            onError={handleImgError}
          />
        </figure>

        <div className="room-footer">
          <div className="room-meta">
            <h3 className="room-title" title={displayName}>
              {displayName}
            </h3>
            <p className="room-size">{capacityText}</p>
          </div>

          <button
            type="button"
            className="room-more"
            onClick={handleMore}
            aria-label={`อ่านเพิ่มเติมเกี่ยวกับ ${displayName}`}
          >
            อ่านเพิ่มเติม
          </button>
        </div>
      </article>

      <RoomDetailModal
        open={open}
        onClose={() => setOpen(false)}
        accommodation={accommodation}
      />
    </>
  );
};

export default memo(RoomTypeCard);
