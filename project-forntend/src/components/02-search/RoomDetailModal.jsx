import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./RoomDetailModal.css";

const RoomDetailModal = ({ show, onClose, room }) => {
  const closeBtnRef = useRef(null);
  useEffect(() => {
    if (!show) return;
    setTimeout(() => closeBtnRef.current?.focus(), 0);
    // ล็อกสกรอลพื้นหลัง
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = old; };
  }, [show]);

  if (!show || !room) return null;

  const node = (
    <div className="rdm rdm--open" role="dialog" aria-modal="true" aria-label={room.name}>
      <div className="rdm__backdrop" onClick={onClose} />
      <div className="rdm__panel">
        <div className="rdm__header">
          <h3 className="rdm__title">{room.name}</h3>
          <button
            ref={closeBtnRef}
            className="rdm__close"
            onClick={onClose}
            aria-label="ปิดหน้าต่างรายละเอียด"
          >
            ×
          </button>
        </div>

        <div className="rdm__media">
          <div className="rdm__main">
            <img src={room.images?.[0]} alt={`${room.name} - ภาพหลัก`} loading="lazy" />
            {room.images?.length > 0 && (
              <div className="rdm__pager">{`1/${room.images.length}`}</div>
            )}
          </div>
          {room.images?.length > 1 && (
            <div className="rdm__thumbs">
              {room.images.map((src, i) => (
                <img key={i} src={src} alt={`${room.name} - ${i + 1}`} loading="lazy" />
              ))}
            </div>
          )}
        </div>

        {room.facilities?.length > 0 && (
          <div className="rdm__section">
            <div className="rdm__section-title">สิ่งอำนวยความสะดวก</div>
            <div className="rdm__amenities">
              <ul>
                {room.facilities.slice(0, Math.ceil(room.facilities.length / 2)).map((f, i) => (
                  <li key={`l-${i}`}>{f}</li>
                ))}
              </ul>
              <ul>
                {room.facilities.slice(Math.ceil(room.facilities.length / 2)).map((f, i) => (
                  <li key={`r-${i}`}>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ✅ ลอยไปต่อท้าย <body> ป้องกันปัญหา z-index / overflow จากพาเรนต์
  return createPortal(node, document.body);
};

export default RoomDetailModal;
