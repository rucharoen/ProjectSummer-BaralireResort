import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import dayjs from "dayjs";
import "dayjs/locale/th";
import th from "date-fns/locale/th";
import TypeService from "@/services/api/accommodation/type.service";
import "./SearchBox.css";
import {
  IconCalendarDown,
  IconCalendarUp,
  IconUser,
  IconDoor,
} from "@tabler/icons-react";
import { createPortal } from "react-dom";
import { goToSearchResults } from "@/utils/searchNav";

registerLocale("th", th);

const MOBILE_QUERY = "(max-width: 540px)";

/* --------------------- Custom Select --------------------- */
function CustomSelect({ icon, value, options, onChange, placeholder = "เลือก" }) {
  const btnRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const [active, setActive] = useState(-1);

  const openMenu = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + window.scrollY + 6, left: r.left + window.scrollX, width: r.width });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!btnRef.current?.contains(e.target) && !e.target.closest(".select-menu")) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault(); openMenu(); return;
    }
    if (!open) return;

    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(options.length - 1, i + 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[active];
      if (opt) { onChange(opt.value); setOpen(false); }
    }
  };

  const selectedLabel = options.find(o => o.value === value)?.label;

  return (
    <>
      <button
        type="button"
        className="select-like-btn has-icon"
        ref={btnRef}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="select-like-icon">
          {icon ?? <IconDoor size={28} stroke={2} />}
        </span>

        <span className="select-like-text">
          {selectedLabel || placeholder}
        </span>

        <span className="select-caret" aria-hidden>▾</span>
      </button>

      {open && createPortal(
        <div
          className="select-menu"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
          role="listbox"
        >
          {options.map((opt, i) => {
            const selected = opt.value === value;
            return (
              <div
                key={opt.value ?? i}
                role="option"
                aria-selected={selected}
                className={
                  "select-menu-item" +
                  (selected ? " is-selected" : "") +
                  (i === active ? " is-active" : "")
                }
                onMouseEnter={() => setActive(i)}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}
/* ------------------- End Custom Select ------------------- */

const SearchBox = ({
  resetFilter,
  destination = "",
  checkIn = null,
  checkOut = null,
  guests = 1,
}) => {
  const navigate = useNavigate();
  const today = new Date();

  const [checkInDate, setCheckInDate] = useState(checkIn ? new Date(checkIn) : null);
  const [checkOutDate, setCheckOutDate] = useState(checkOut ? new Date(checkOut) : null);
  const [destinationState, setDestination] = useState(destination);

  const [roomsCount, setRoomsCount] = useState(1);
  const [adultsCount, setAdultsCount] = useState(guests || 1);
  const [childrenCount, setChildrenCount] = useState(0);

  const [dateError, setDateError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState([]);

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarPos, setCalendarPos] = useState({ top: 0, left: 0 });
  const [guestPopupVisible, setGuestPopupVisible] = useState(false);
  const [guestPopupPos, setGuestPopupPos] = useState({ top: 0, left: 0 });

  const dateButtonRef = useRef(null);
  const guestButtonRef = useRef(null);

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.matchMedia(MOBILE_QUERY).matches : false
  );
  const [openPicker, setOpenPicker] = useState(null); // 'in' | 'out' | null

  // โหลดประเภทห้อง
  useEffect(() => {
    TypeService.getAll()
      .then((res) => setTypes(res.data || []))
      .catch(console.error);
  }, []);

  // sync props
  useEffect(() => {
    setCheckInDate(checkIn ? new Date(checkIn) : null);
    setCheckOutDate(checkOut ? new Date(checkOut) : null);
    setDestination(destination);
    setAdultsCount(guests || 1);
  }, [checkIn, checkOut, destination, guests]);

  // media query
  useEffect(() => {
    const mm = window.matchMedia(MOBILE_QUERY);
    const handler = () => setIsMobile(mm.matches);
    mm.addEventListener?.("change", handler);
    return () => mm.removeEventListener?.("change", handler);
  }, []);

  // ปิด calendar เมื่อคลิกนอก
  useEffect(() => {
    const closeCalendar = (e) => {
      if (!dateButtonRef.current?.contains(e.target) && !e.target.closest(".calendar-popover")) {
        setShowCalendar(false);
        setOpenPicker(null);
      }
    };
    document.addEventListener("mousedown", closeCalendar);
    return () => document.removeEventListener("mousedown", closeCalendar);
  }, []);

  // ปิด guest popup เมื่อคลิกนอก
  useEffect(() => {
    const closeGuestPopup = (e) => {
      if (!e.target.closest(".guest-selector") && !e.target.closest(".guest-popup")) {
        setGuestPopupVisible(false);
      }
    };
    document.addEventListener("click", closeGuestPopup);
    return () => document.removeEventListener("click", closeGuestPopup);
  }, []);

  const toggleCalendar = () => {
    if (!showCalendar && dateButtonRef.current) {
      const rect = dateButtonRef.current.getBoundingClientRect();
      setCalendarPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
    if (!showCalendar) setOpenPicker(isMobile ? "in" : null);
    setShowCalendar((prev) => !prev);
    setDateError(false);
  };

  const toggleGuestPopup = (e) => {
    e.stopPropagation();
    if (!guestPopupVisible && guestButtonRef.current) {
      const rect = guestButtonRef.current.getBoundingClientRect();
      setGuestPopupPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
    setGuestPopupVisible((prev) => !prev);
  };

  // กฎพื้นฐาน: 1 ห้องรองรับ 3 คน (อย่างน้อย 1 ผู้ใหญ่ต่อการจอง), เด็กได้เท่าที่เหลือจากโควตาคน
  const getMaxAdults = (rooms) => rooms * 3; // กำหนดค่าสูงสุดเชิงกลไก
  const getMaxChildren = (rooms, adults) => {
    const remain = rooms * 3 - adults;
    return remain > 0 ? remain : 0;
  };

  const changeCount = (key, delta) => {
    let newRooms = roomsCount;
    let newAdults = adultsCount;
    let newChildren = childrenCount;

    if (key === "rooms") {
      newRooms = Math.max(1, Math.min(9, roomsCount + delta));
      const maxA = getMaxAdults(newRooms);
      if (newAdults > maxA) newAdults = maxA;
      const maxC = getMaxChildren(newRooms, newAdults);
      if (newChildren > maxC) newChildren = maxC;
      setRoomsCount(newRooms); setAdultsCount(newAdults); setChildrenCount(newChildren);
      return;
    }
    if (key === "adults") {
      const maxA = getMaxAdults(roomsCount);
      newAdults = Math.max(1, Math.min(maxA, adultsCount + delta));
      const maxC = getMaxChildren(roomsCount, newAdults);
      if (newChildren > maxC) newChildren = maxC;
      setAdultsCount(newAdults); setChildrenCount(newChildren);
      return;
    }
    if (key === "children") {
      const maxC = getMaxChildren(roomsCount, adultsCount);
      newChildren = Math.max(0, Math.min(maxC, childrenCount + delta));
      setChildrenCount(newChildren);
      return;
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!checkInDate || !checkOutDate) return setDateError(true);
    setLoading(true);

    // หน่วงเล็กน้อยเพื่อ UX (เอาออกได้)
    await new Promise((r) => setTimeout(r, 400));

    goToSearchResults(navigate, {
      destination: destinationState,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      rooms: roomsCount,
      adults: adultsCount,
      children: childrenCount,
      guests: roomsCount + adultsCount + childrenCount,
    });

    setLoading(false);
  };

  const onSelectCheckIn = (d) => {
    setCheckInDate(d);
    if (checkOutDate && d >= checkOutDate) setCheckOutDate(null);
    if (isMobile) setOpenPicker("out");
  };
  const onSelectCheckOut = (d) => {
    setCheckOutDate(d);
    if (isMobile) { setOpenPicker(null); setShowCalendar(false); }
  };

  return (
    <div id="searchbox" className={`searchbox-container${dateError ? " error" : ""}`}>
      <form onSubmit={handleSearch}>
        {dateError && <div className="date-error">กรุณากรอกข้อมูลวันที่ต้องการเข้าพัก</div>}

        <div className="searchbox-row">
          {/* วันที่ */}
          <div className="searchbox-col date">
            <div className="agoda-date-container" ref={dateButtonRef}>
              <button type="button" className="agoda-date-button" onClick={toggleCalendar}>
                <IconCalendarUp stroke={2} size={32} />
                <span className="calendar-text">
                  {checkInDate ? dayjs(checkInDate).format("DD/MM/YYYY") : "  วันเช็คอิน"}
                </span>
              </button>
              <hr />
              <button type="button" className="agoda-date-button" onClick={toggleCalendar}>
                <IconCalendarDown stroke={2} size={32} />
                <span className="calendar-text">
                  {checkOutDate ? dayjs(checkOutDate).format("DD/MM/YYYY") : "วันเช็คเอาท์"}
                </span>
              </button>
            </div>

            {showCalendar && createPortal(
              <div className="calendar-popover" style={calendarPos}>
                {isMobile ? (
                  <div className="calendar-wrapper">
                    {openPicker === "out" ? (
                      <div>
                        <label>เช็คเอาท์</label>
                        <DatePicker
                          inline locale="th" selected={checkOutDate}
                          onChange={onSelectCheckOut}
                          minDate={checkInDate || today} dateFormat="dd/MM/yyyy"
                        />
                      </div>
                    ) : (
                      <div>
                        <label>เช็คอิน</label>
                        <DatePicker
                          inline locale="th" selected={checkInDate}
                          onChange={onSelectCheckIn}
                          minDate={today} dateFormat="dd/MM/yyyy"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="calendar-wrapper">
                    <div>
                      <label>เช็คอิน</label>
                      <DatePicker
                        inline locale="th" selected={checkInDate}
                        onChange={onSelectCheckIn}
                        minDate={today} dateFormat="dd/MM/yyyy"
                      />
                    </div>
                    <div>
                      <label>เช็คเอาท์</label>
                      <DatePicker
                        inline locale="th" selected={checkOutDate}
                        onChange={onSelectCheckOut}
                        minDate={checkInDate || today} dateFormat="dd/MM/yyyy"
                      />
                    </div>
                  </div>
                )}
              </div>,
              document.body
            )}
          </div>

          {/* ประเภทห้อง */}
          <div className="searchbox-col type">
            <CustomSelect
              icon={<IconDoor size={28} stroke={2} />}
              value={destinationState}
              onChange={setDestination}
              placeholder="ประเภทห้องพัก"
              options={[
                { value: "", label: "ทั้งหมด" },
                ...types.map((t) => ({ value: t.name, label: t.name })),
              ]}
            />
          </div>

          {/* ผู้เข้าพัก */}
          <div className="searchbox-col guests" style={{ position: "relative" }}>
            <div className="guest-selector" onClick={toggleGuestPopup} ref={guestButtonRef}>
              <IconUser stroke={2} size={32} />
              <span>{`${roomsCount} ห้อง, ${adultsCount} ผู้ใหญ่${childrenCount > 0 ? `, ${childrenCount} เด็ก` : ``}`}</span>
            </div>
            {guestPopupVisible && createPortal(
              <div className="guest-popup" style={guestPopupPos}>
                {[
                  { label: "ห้อง", key: "rooms", val: roomsCount },
                  { label: "ผู้ใหญ่", key: "adults", val: adultsCount },
                  { label: "เด็ก", key: "children", val: childrenCount }
                ].map(({ label, key, val }) => (
                  <div key={key} className="guest-row">
                    <span>{label}</span>
                    <div className="counter">
                      <button
                        onClick={(e) => { e.stopPropagation(); changeCount(key, -1); }}
                        disabled={
                          (key === "adults" && val <= 1) ||
                          (key === "children" && val <= 0) ||
                          (key === "rooms" && val <= 1)
                        }
                      >-</button>
                      <span>{val}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); changeCount(key, 1); }}
                        disabled={
                          (key === "adults" && val >= getMaxAdults(roomsCount)) ||
                          (key === "children" && val >= getMaxChildren(roomsCount, adultsCount)) ||
                          (key === "rooms" && val >= 9)
                        }
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>,
              document.body
            )}
          </div>

          <div className="searchbox-col button">
            <button className="search-button" type="submit" disabled={loading}>
              {loading ? "กำลังค้นหา" : "ค้นหา"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SearchBox;
