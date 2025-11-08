import React, { useEffect, useRef, useState } from "react";
import { Spinner, Button } from "react-bootstrap";
import { IconMathGreater, IconMathLower } from "@tabler/icons-react";
import RoomTypeCard from "./RoomTypeCard";
import AccommodationService from "../../services/api/accommodation/accommodation.service";

const CARD_WIDTH = 360;
const CARD_GAP_DESKTOP = 17;
const VISIBLE_COUNT_DESKTOP = 3;
const VIEWPORT_WIDTH =
  CARD_WIDTH * VISIBLE_COUNT_DESKTOP +
  CARD_GAP_DESKTOP * (VISIBLE_COUNT_DESKTOP - 1);

export default function RoomType() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollRef = useRef(null);

  // ---------- helpers ----------
  const getItems = () => {
    const el = scrollRef.current;
    return el ? Array.from(el.querySelectorAll('[data-rt-item="1"]')) : [];
  };

  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  // โหลดข้อมูล
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await AccommodationService.getAll();
        setPromotions(res?.data || []);
      } catch (e) {
        console.error("Error fetching accommodations:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ตรวจมือถือ
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 576px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // อัปเดตลูกศร
  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    const tol = 10;
    const atStart = el.scrollLeft <= tol;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - tol;
    setShowLeft(!isMobile && !atStart);
    setShowRight(!isMobile && !atEnd && el.scrollWidth > el.clientWidth + tol);
  };

  // อัปเดต index จากตำแหน่งจริง
  const updateCurrentIndex = () => {
    const el = scrollRef.current;
    if (!el) return;
    const items = getItems();
    if (!items.length) return;

    let best = 0;
    let bestDist = Infinity;
    const sl = el.scrollLeft;

    items.forEach((node, i) => {
      const left = node.offsetLeft; // no TS cast
      const dist = Math.abs(sl - left);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });

    setCurrentIndex(best);
  };

  const onScrolled = () => {
    updateArrows();
    updateCurrentIndex();
  };

  const scrollToIndex = (idx) => {
    const el = scrollRef.current;
    const items = getItems();
    if (!el || !items.length) return;

    const clamped = clamp(idx, 0, items.length - 1);
    const targetLeft = items[clamped].offsetLeft;
    el.scrollTo({ left: targetLeft, behavior: "smooth" });
  };

  const handleScroll = (dir) => {
    const next = dir === "right" ? currentIndex + 1 : currentIndex - 1;
    scrollToIndex(next);
  };

  // สังเกต layout/รูปโหลด เพื่ออัปเดตปุ่ม+index ครั้งแรก
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      updateArrows();
      updateCurrentIndex();
    });
    ro.observe(el);

    const imgs = Array.from(el.querySelectorAll("img"));
    const onImg = () => {
      updateArrows();
      updateCurrentIndex();
    };
    imgs.forEach((img) => {
      if (img.complete) setTimeout(onImg, 0);
      else {
        img.addEventListener("load", onImg);
        img.addEventListener("error", onImg);
      }
    });

    const t = setTimeout(() => {
      updateArrows();
      updateCurrentIndex();
    }, 0);

    return () => {
      ro.disconnect();
      clearTimeout(t);
      imgs.forEach((img) => {
        img.removeEventListener("load", onImg);
        img.removeEventListener("error", onImg);
      });
    };
  }, [loading, promotions.length, isMobile]);

  const gap = isMobile ? 12 : CARD_GAP_DESKTOP;

  return (
    <div
      className="position-relative"
      style={{ paddingInline: isMobile ? 0 : "2.5rem" }}
    >
      {/* arrows เฉพาะเดสก์ท็อป/แท็บเล็ต */}
      {showLeft && !isMobile && (
        <Button
          variant="light"
          className="position-absolute start-0 top-50 translate-middle-y z-3 d-flex align-items-center justify-content-center"
          style={{
            height: 46.55,
            width: 46.55,
            borderRadius: "50%",
            border: "1px solid #ccc",
            backgroundColor: "rgba(70, 212, 255, 1)",
            boxShadow: "0 0 5px rgba(0,0,0,0.2)",
          }}
          onClick={() => handleScroll("left")}
          aria-label="เลื่อนไปซ้าย"
        >
          <IconMathLower stroke={2} color="white" />
        </Button>
      )}

      {showRight && !isMobile && !loading && promotions.length > 0 && (
        <Button
          variant="light"
          className="position-absolute end-0 top-50 translate-middle-y z-3 d-flex align-items-center justify-content-center"
          style={{
            height: 46.55,
            width: 46.55,
            borderRadius: "50%",
            border: "1px solid #ccc",
            backgroundColor: "rgba(70, 212, 255, 1)",
            boxShadow: "0 0 5px rgba(0,0,0,0.2)",
          }}
          onClick={() => handleScroll("right")}
          aria-label="เลื่อนไปขวา"
        >
          <IconMathGreater stroke={2} color="white" />
        </Button>
      )}

      {/* viewport จำกัดให้เห็น 3 ใบบนเดสก์ท็อป */}
      <div className="position-relative d-flex justify-content-center">
        <div
          className="cards-viewport"
          style={{
            width: isMobile ? "100%" : `${VIEWPORT_WIDTH}px`,
            margin: "0 auto",
          }}
        >
          <div
            ref={scrollRef}
            onScroll={onScrolled}
            className="d-flex flex-nowrap overflow-auto"
            style={{
              gap: `${gap}px`,
              paddingInline: isMobile ? 0 : 5,
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {/* ซ่อนสครอลบาร์ (WebKit) */}
            <style>
              {`.d-flex.flex-nowrap.overflow-auto::-webkit-scrollbar{display:none;}`}
            </style>

            {loading ? (
              <div className="text-center w-100 my-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : promotions.length > 0 ? (
              promotions.map((item) => (
                <div
                  key={item.id}
                  data-rt-item="1"
                  style={{
                    flex: "0 0 auto",
                    minWidth: isMobile ? "auto" : `${CARD_WIDTH}px`,
                    width: isMobile ? "auto" : `${CARD_WIDTH}px`,
                    scrollSnapAlign: "start",
                  }}
                >
                  <RoomTypeCard accommodation={item} />
                </div>
              ))
            ) : (
              <div className="text-center w-100">
                <p className="text-danger">ไม่สามารถโหลดข้อมูลประเภทห้องได้</p>
              </div>
            )}
          </div>

          {/* ดอท (มือถือเท่านั้น) */}
          {isMobile && promotions.length > 1 && (
            <div
              className="d-flex justify-content-center"
              style={{ gap: 8, marginTop: 12, marginBottom: 8 }}
            >
              {promotions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollToIndex(i)}
                  aria-label={`ไปการ์ดที่ ${i + 1}`}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    border: "none",
                    outline: "none",
                    padding: 0,
                    cursor: "pointer",
                    backgroundColor: i === currentIndex ? "#000" : "#bdbdbd",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
