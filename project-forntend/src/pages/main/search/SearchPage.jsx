import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  useNavigate,
  useSearchParams,
  createSearchParams,
  useLocation,
} from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/th";

import SearchBox from "@/components/02-search/SearchBox";
import TypeService from "@/services/api/accommodation/type.service";
import AuthService from "@/services/auth/auth.service";
import AccommodationService from "@/services/api/accommodation/accommodation.service";
import RoomDetailModal from "@/components/02-search/RoomDetailModal";
import LoginPage from "@/pages/main/login/LoginPage";
import { useCart } from "@/pages/main/cart/CartContext";

import "./SearchPage.css";

dayjs.locale("th");
const BASE_URL = import.meta.env.VITE_BASE_URL ?? "";

/* -------------------- Utils -------------------- */
const getImageUrl = (imageName) =>
  imageName
    ? `${BASE_URL}/uploads/accommodations/${encodeURIComponent(imageName)}`
    : "https://picsum.photos/id/57/800/600";

const formatDateTH = (iso) =>
  iso ? dayjs(iso).add(543, "year").format("DD/MM/YY") : "";

const StarRating = ({ value = 4, count = 5 }) => (
  <div className="sp-stars" aria-label={`เรตติ้ง ${value}/${count}`}>
    {Array.from({ length: count }).map((_, i) => (
      <i key={i} className={`bi ${i < value ? "bi-star-fill" : "bi-star"}`} />
    ))}
  </div>
);

/* -------------------- Mobile search header -------------------- */
function MobileSearchBar({ destination, checkIn, checkOut, guests, onOpen }) {
  const top = destination?.trim() || "ทั้งหมด";
  const bottom = `${formatDateTH(checkIn)} - ${formatDateTH(
    checkOut
  )} │ 1 ห้อง, ${guests} ผู้ใหญ่`;
  return (
    <div className="msb">
      <button
        className="msb__inner"
        onClick={onOpen}
        aria-label="แก้ไขการค้นหา"
      >
        <div className="msb__text">
          <div className="msb__line-top">{top}</div>
          <div className="msb__line-bottom">{bottom}</div>
        </div>
        <i className="bi bi-search msb__icon" aria-hidden />
      </button>
    </div>
  );
}

function MobileSearchEditor({ open, types = [], initial, onClose, onApply }) {
  const [dest, setDest] = useState(initial.destination || "");
  const [inDate, setIn] = useState(initial.checkIn || "");
  const [outDate, setOut] = useState(initial.checkOut || "");
  const [adults, setAdults] = useState(String(initial.guests || 1));
  const [children, setChildren] = useState(String(initial.children || 0));

  useEffect(() => {
    setDest(initial.destination || "");
    setIn(initial.checkIn || "");
    setOut(initial.checkOut || "");
    setAdults(String(initial.guests || 1));
    setChildren(String(initial.children || 0));
  }, [initial]);

  if (!open) return null;

  return (
    <div className="sheet" role="dialog" aria-modal>
      <div className="sheet__card">
        <div className="sheet__header">
          <span>แก้ไขการค้นหา</span>
          <button className="sheet__close" onClick={onClose} aria-label="ปิด">
            ×
          </button>
        </div>
        <div className="sheet__form">
          <label className="sheet__label">เช็คอิน</label>
          <input
            type="date"
            className="sheet__input"
            value={inDate}
            onChange={(e) => setIn(e.target.value)}
          />
          <label className="sheet__label">เช็คเอาท์</label>
          <input
            type="date"
            className="sheet__input"
            value={outDate}
            onChange={(e) => setOut(e.target.value)}
          />
          <label className="sheet__label">ประเภทห้องพัก</label>
          <select
            className="sheet__input"
            value={dest}
            onChange={(e) => setDest(e.target.value)}
          >
            <option value="">ทั้งหมด</option>
            {types.map((t) => (
              <option key={t.id ?? t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
          <label className="sheet__label">ผู้ใหญ่</label>
          <input
            type="number"
            min="1"
            className="sheet__input"
            value={adults}
            onChange={(e) => setAdults(e.target.value)}
          />
          <label className="sheet__label">เด็ก</label>
          <input
            type="number"
            min="0"
            className="sheet__input"
            value={children}
            onChange={(e) => setChildren(e.target.value)}
          />
        </div>
        <button
          className="sheet__apply"
          onClick={() =>
            onApply({
              destination: dest,
              checkIn: inDate,
              checkOut: outDate,
              guests: adults,
              children,
            })
          }
        >
          ค้นหา
        </button>
      </div>
    </div>
  );
}

/* -------------------- Main page -------------------- */
const defaultFilters = {
  priceRange: [0, 10000],
  breakfast: false,
  freeCancel: false,
  highRating: false,
  selectedTypes: [],
};

const useIsMobile = (bp = 768) => {
  const [v, setV] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp}px)`);
    const on = () => setV(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    mq.addListener?.(on);
    return () => {
      mq.removeEventListener?.("change", on);
      mq.removeListener?.(on);
    };
  }, [bp]);
  return v;
};

const SearchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();


  const isMobile = useIsMobile(768);
  const [openEditor, setOpenEditor] = useState(false);

  const {
    destination = "",
    checkIn = "",
    checkOut = "",
    guests = 1,
  } = Object.fromEntries([...searchParams]);

  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [originalResults, setOriginalResults] = useState([]);
  const [filters] = useState(defaultFilters);
  const [roomQuantities, setRoomQuantities] = useState({});
  const [promotions, setPromotions] = useState([]);

  const [showLogin, setShowLogin] = useState(false);

  // ===== Modal state (สำคัญสำหรับป๊อปอัป) =====
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedRoomDetail, setSelectedRoomDetail] = useState(null);

  const pendingActionRef = useRef(null);

  /* ----- login handoff ----- */
  const afterLogin = useCallback(() => {
    const cb = pendingActionRef.current;
    pendingActionRef.current = null;
    if (typeof cb === "function") cb();
  }, []);

  const ensureLogin = useCallback((runAfterLogin) => {
    if (AuthService.getCurrentUser()) return true;
    pendingActionRef.current = runAfterLogin || null;
    setShowLogin(true);
    return false;
  }, []);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "user" && localStorage.getItem("user")) {
        setShowLogin(false);
        afterLogin();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [afterLogin]);

  useEffect(() => {
    if (!showLogin) return;
    const id = setInterval(() => {
      if (AuthService.getCurrentUser()) {
        clearInterval(id);
        setShowLogin(false);
        afterLogin();
      }
    }, 300);
    return () => clearInterval(id);
  }, [showLogin, afterLogin]);

  /* ----- search state URL apply ----- */
  const applyMobileSearch = useCallback(
    (vals) => {
      const qs = `?${createSearchParams({
        destination: vals.destination || "",
        checkIn: vals.checkIn || "",
        checkOut: vals.checkOut || "",
        guests: vals.guests || "1",
        children: vals.children || "0",
      }).toString()}`;
      navigate(`${location.pathname}${qs}`, { replace: true });
      setOpenEditor(false);
    },
    [navigate, location.pathname]
  );

  /* ----- fetch types once ----- */
  useEffect(() => {
    document.title = "Barali Beach Resort";
    TypeService.getAll()
      .then((res) => setTypes(res?.data || []))
      .catch(() => setTypes([]));
  }, []);

  /* ----- fetch rooms ----- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = destination
        ? await AccommodationService.getSearch(
            destination,
            checkIn,
            checkOut,
            guests
          )
        : await AccommodationService.getWithRates();
      setOriginalResults(res?.data || []);
    } catch (e) {
      console.error("SearchPage fetch error:", e);
      setOriginalResults([]);
    } finally {
      setLoading(false);
    }
  }, [destination, checkIn, checkOut, guests]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ----- compute price/promo ----- */
  const results = useMemo(() => {
    return (originalResults || [])
      .filter((acc) =>
        !destination
          ? true
          : String(acc.type?.name || "").toLowerCase() ===
            String(destination).toLowerCase()
      )
      .map((acc) => {
        const basePrice = acc.ratePlans?.length
          ? Math.min(
              ...acc.ratePlans.map((rp) => Number(rp.price_per_night || 0))
            )
          : Number(acc.price_per_night || 0);
        const now = new Date();
        const matchedPromo = promotions.find(
          (p) =>
            p.accommodation_id === acc.id &&
            new Date(p.start_date) <= now &&
            now <= new Date(p.end_date)
        );
        const discount = matchedPromo?.discount ?? acc.discount ?? 0;
        const discountedPrice =
          discount > 0
            ? Math.round(basePrice * (1 - discount / 100))
            : basePrice;
        return {
          ...acc,
          basePrice,
          discount,
          discountedPrice,
          promo: matchedPromo ?? null,
        };
      });
  }, [originalResults, promotions, destination]);

  /* ----- quantity ----- */
  const updateQty = useCallback((key, delta) => {
    setRoomQuantities((prev) => ({
      ...prev,
      [key]: Math.max(1, (prev[key] || 1) + delta),
    }));
  }, []);

  /* ----- cart/book ----- */
  const { add } = useCart();

  const doAddToCart = useCallback(
    (acc, rp = null) => {
      const qKey = rp ? `${acc.id}-${rp.id}` : String(acc.id);
      const qty = Math.max(1, Number(roomQuantities[qKey] || 1));
      const price = rp
        ? Number(rp.price_per_night || acc.basePrice || 0)
        : Number((acc.discountedPrice ?? acc.basePrice) || 0);
      const name = rp ? `${acc.name} - ${rp.name}` : acc.name;

      add(
        {
          id: rp ? `${acc.id}:${rp.id}` : String(acc.id),
          name,
          price,
          qty,
          cover: getImageUrl(acc.image_name),
          perks: (acc.amenities?.split(",") || [])
            .map((a) => a.trim())
            .filter(Boolean),
        },
        qty
      );
    },
    [add, roomQuantities]
  );

  const handleAddToCart = useCallback(
    (acc, rp = null) => {
      if (!ensureLogin(() => doAddToCart(acc, rp))) return;
      doAddToCart(acc, rp);
    },
    [ensureLogin, doAddToCart]
  );

  const doNavigateBook = useCallback(
    (bookingData) => navigate("/book", { state: bookingData }),
    [navigate]
  );

  const handleBook = useCallback(
    (acc) => {
      const bookingData = {
        id: acc.id,
        name: acc.name,
        image: getImageUrl(acc.image_name),
        price: acc.discountedPrice ?? acc.basePrice,
        checkIn,
        checkOut,
      };
      if (!ensureLogin(() => doNavigateBook(bookingData))) return;
      doNavigateBook(bookingData);
    },
    [checkIn, checkOut, ensureLogin, doNavigateBook]
  );

  const handleBookWithRate = useCallback(
    (acc, rp) => {
      const bookingData = {
        id: acc.id,
        name: acc.name,
        image: getImageUrl(acc.image_name),
        price: Number(rp.price_per_night || acc.basePrice),
        checkIn,
        checkOut,
        ratePlanId: rp.id,
        ratePlanName: rp.name,
      };
      if (!ensureLogin(() => doNavigateBook(bookingData))) return;
      doNavigateBook(bookingData);
    },
    [checkIn, checkOut, ensureLogin, doNavigateBook]
  );

  /* ----- image modal (ปุ่ม/รูปทั้งหมดจะเรียกฟังก์ชันนี้) ----- */
  const openImages = useCallback((acc) => {
    const images = [acc.image_name, acc.image_name2, acc.image_name3]
      .filter(Boolean)
      .map(getImageUrl);

    setSelectedRoomDetail({
      name: acc.name,
      images,
      facilities: (acc.amenities?.split(",") || []).map((s) => s.trim()),
    });
    setShowImageModal(true);
  }, []);

  if (loading) return <div className="sp-loading">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="sp">
      {/* Header search */}
      {isMobile ? (
        <>
          <MobileSearchBar
            destination={destination}
            checkIn={checkIn}
            checkOut={checkOut}
            guests={parseInt(guests) || 1}
            onOpen={() => setOpenEditor(true)}
          />
          <MobileSearchEditor
            open={openEditor}
            types={types}
            initial={{ destination, checkIn, checkOut, guests }}
            onClose={() => setOpenEditor(false)}
            onApply={applyMobileSearch}
          />
        </>
      ) : (
        <SearchBox
          destination={destination}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={parseInt(guests) || 1}
        />
      )}

      <div className="sp__count">พบ {results.length} รายการ</div>

      {/* Results */}
      <div className="sp-list">
        {results.map((acc) => (
          <div key={acc.id} className="sp-card">
            {/* left */}
            <div className="sp-card__left">
              <h2 className="sp-card__title">{acc.name}</h2>

              <div className="sp-media" onClick={() => openImages(acc)}>
                <img
                  className="sp-media__main"
                  src={getImageUrl(acc.image_name)}
                  alt={acc.name}
                  loading="lazy"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") && openImages(acc)
                  }
                />
                <div className="sp-media__grid">
                  {[acc.image_name2, acc.image_name3]
                    .filter(Boolean)
                    .map((img, i) => (
                      <img
                        key={`${acc.id}-img-${i}`}
                        className="sp-media__sub"
                        src={getImageUrl(img)}
                        alt={`${acc.name}-${i + 1}`}
                        loading="lazy"
                        role="button"
                        tabIndex={0}
                        onClick={() => openImages(acc)}
                        onKeyDown={(e) =>
                          (e.key === "Enter" || e.key === " ") &&
                          openImages(acc)
                        }
                      />
                    ))}
                </div>
              </div>

              <button
                type="button"
                className="sp-link"
                onClick={() => openImages(acc)}
              >
                คลิกดูรายละเอียดห้องและรูปเพิ่มเติม
              </button>
            </div>

            {/* right */}
            <div className="sp-card__right">
              <div className="sp-right__head">รายละเอียดห้องพัก</div>

              <div className="sp-rate-list">
                {acc.ratePlans?.length ? (
                  acc.ratePlans
                    .slice()
                    .sort(
                      (a, b) =>
                        Number(a.price_per_night || 0) -
                        Number(b.price_per_night || 0)
                    )
                    .map((rp, idx) => {
                      const best = idx === 0 && acc.discount > 0;
                      const qKey = `${acc.id}-${rp.id}`;
                      return (
                        <div key={rp.id} className="sp-rate">
                          <div className="sp-rate__features">
                            <ul className="sp-feat">
                              {(acc.amenities?.split(",") || [])
                                .filter(Boolean)
                                .map((t, i) => (
                                  <li key={i}>
                                    <i className="bi bi-check2-square" />
                                    {t.trim()}
                                  </li>
                                ))}
                              <li>
                                <i className="bi bi-plus-square" />
                                ส่วนลด 10% เฉพาะค่าอาหารที่ห้องอาหารโรงแรม
                              </li>
                            </ul>
                          </div>

                          <div className="sp-rate__box">
                            <div className="sp-rate__top">
                              <div className="sp-rate__rating">
                                <StarRating value={4} />
                                <span className="sp-rate__count">(95)</span>
                              </div>
                              {best && (
                                <div className="sp-saving">
                                  <div className="sp-saving__strike">
                                    {Number(
                                      acc.basePrice || 0
                                    ).toLocaleString()}{" "}
                                    บาท
                                  </div>
                                  <div className="sp-saving__green">
                                    ประหยัด {acc.discount}%
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="sp-price">
                              <div
                                className={`sp-price__strike ${
                                  best ? "is-visible" : ""
                                }`}
                              >
                                {best
                                  ? `${Number(
                                      acc.basePrice || 0
                                    ).toLocaleString()} บาท`
                                  : "\u00A0"}
                              </div>
                              <div className="sp-price__main">
                                THB{" "}
                                <span className="sp-price__num">
                                  {Number(rp.price_per_night).toLocaleString()}
                                </span>{" "}
                                /คืน
                              </div>
                              <div className="sp-price__note">
                                รวมภาษีและค่าธรรมเนียม
                              </div>
                            </div>

                            <div className="sp-actions">
                              <div className="qty">
                                <button
                                  type="button"
                                  className="qty__btn"
                                  onClick={() => updateQty(qKey, -1)}
                                  aria-label="ลดจำนวนห้อง"
                                >
                                  −
                                </button>
                                <span className="qty__val">
                                  {roomQuantities[qKey] || 1}
                                </span>
                                <button
                                  type="button"
                                  className="qty__btn"
                                  onClick={() => updateQty(qKey, 1)}
                                  aria-label="เพิ่มจำนวนห้อง"
                                >
                                  +
                                </button>
                              </div>
                              <div className="sp-actions__btns">
                                <button
                                  type="button"
                                  className="btn btn--outline"
                                  onClick={() => handleAddToCart(acc, rp)}
                                >
                                  <i className="bi bi-cart-plus" />{" "}
                                  เพิ่มเข้ารถเข็น
                                </button>
                                <button
                                  type="button"
                                  className="btn btn--primary"
                                  onClick={() => handleBookWithRate(acc, rp)}
                                >
                                  จองเลยตอนนี้
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="sp-rate">
                    <div className="sp-rate__features">
                      <ul className="sp-feat">
                        {(acc.amenities?.split(",") || [])
                          .filter(Boolean)
                          .map((t, i) => (
                            <li key={i}>
                              <i className="bi bi-check2-square" />
                              {t.trim()}
                            </li>
                          ))}
                        <li>
                          <i className="bi bi-plus-square" />
                          ส่วนลด 10% เฉพาะค่าอาหารที่ห้องอาหารโรงแรม
                        </li>
                      </ul>
                    </div>
                    <div className="sp-rate__box">
                      {acc.discount > 0 && (
                        <div className="sp-saving sp-saving--right">
                          <div className="sp-saving__strike">
                            {Number(acc.basePrice || 0).toLocaleString()} บาท
                          </div>
                          <div className="sp-saving__green">
                            ประหยัด {acc.discount}%
                          </div>
                        </div>
                      )}
                      <div className="sp-price__main sp-price__main--only">
                        THB{" "}
                        <span className="sp-price__num">
                          {Number(
                            acc.discountedPrice || acc.basePrice || 0
                          ).toLocaleString()}
                        </span>{" "}
                        /คืน
                      </div>
                      <div className="sp-price__note">
                        รวมภาษีและค่าธรรมเนียม
                      </div>
                      <div className="sp-actions">
                        <div className="qty">
                          <button
                            type="button"
                            className="qty__btn"
                            onClick={() => updateQty(String(acc.id), -1)}
                          >
                            −
                          </button>
                          <span className="qty__val">
                            {roomQuantities[String(acc.id)] || 1}
                          </span>
                          <button
                            type="button"
                            className="qty__btn"
                            onClick={() => updateQty(String(acc.id), 1)}
                          >
                            +
                          </button>
                        </div>
                        <div className="sp-actions__btns">
                          <button
                            type="button"
                            className="btn btn--outline"
                            onClick={() => handleAddToCart(acc)}
                          >
                            เพิ่มเข้ารถเข็น <i className="bi bi-cart-plus" /> 
                          </button>
                          <button
                            type="button"
                            className="btn btn--primary"
                            onClick={() => handleBook(acc)}
                          >
                            จองเลยตอนนี้
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showLogin && (
        <LoginPage
          closeLogin={() => setShowLogin(false)}
          onLoggedIn={() => {
            setShowLogin(false);
            afterLogin();
          }}
        />
      )}

      {/* ===== Modal แสดงรูป/รายละเอียด ===== */}
      {showImageModal && selectedRoomDetail && (
        <RoomDetailModal
          show={showImageModal}
          onClose={() => {
            setShowImageModal(false);
            setSelectedRoomDetail(null);
          }}
          room={selectedRoomDetail}
        />
      )}
    </div>
  );
};

export default SearchPage;
