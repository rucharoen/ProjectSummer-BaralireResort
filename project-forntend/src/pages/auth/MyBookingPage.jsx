import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AuthService from "@/services/auth/auth.service";
import BookingService from "@/services/api/booking/booking.service";
import dayjs from "dayjs";
import "dayjs/locale/th";
dayjs.locale("th");

const fmt = (d) => (d ? dayjs(d).format("DD MMM YYYY") : "-");

const Badge = ({ tone = "secondary", children }) => (
  <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full bg-${tone}-100 text-${tone}-800`}>
    {children}
  </span>
);

// Tailwind utility fallback (ถ้าไม่มี Tailwind ให้ใช้ className ธรรมดาได้)
export default function MyBookingPage() {
  const user = AuthService.getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user?.id) return;
        const { data } = await BookingService.getMyBookings(user.id);
        if (mounted) setRows(data?.rows || []);
      } catch (e) {
        console.error(e);
        alert(e?.response?.data?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const hasData = rows.length > 0;

  return (
    <div className="container py-4">
      <h3 className="fw-bold mb-3">การจองของฉัน</h3>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" />
          <div className="mt-2 text-muted">กำลังโหลดข้อมูล…</div>
        </div>
      )}

      {!loading && !hasData && (
        <EmptyState />
      )}

      {!loading && hasData && (
        <div className="d-flex flex-column gap-3">
          {rows.map((it) => (
            <BookingCard key={it.id} it={it} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingCard({ it }) {
  const nights = it.totalNights ?? 0;
  const payTone =
    it.payment?.status === "Paid" ? "success" :
    it.payment?.status === "Failed" ? "danger" : "warning";

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex gap-3">
          <img
            src={it.accommodation.image}
            alt={it.accommodation.name}
            style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 8 }}
          />
          <div className="flex-fill">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h5 className="mb-0">{it.accommodation.name}</h5>
              <Badge tone={payTone}>{it.payment?.status || "Pending"}</Badge>
              <Badge tone="secondary">{it.bookingStatus}</Badge>
            </div>

            <div className="text-muted small mt-1">
              เข้าพัก {fmt(it.period.checkIn)} – {fmt(it.period.checkOut)} · {nights} คืน · ห้อง {it.numberOfRooms} · ผู้ใหญ่ {it.guests.adult}{it.guests.child ? ` · เด็ก ${it.guests.child}` : ""}
            </div>

            <div className="d-flex align-items-center justify-content-between mt-2">
              <div className="text-muted small">
                วิธีชำระเงิน: {it.paymentMethod} · สร้างเมื่อ {fmt(it.createdAt)}
              </div>
              <div className="fw-bold">
                {Number(it.totalPrice || 0).toLocaleString()} บาท
              </div>
            </div>
          </div>
        </div>

        {it.payment?.status !== "Paid" && (
          <div className="d-flex gap-2 justify-content-end mt-3">
            {/* ปุ่มตัวอย่าง – คุณจะนำไปผูกกับ flow ชำระเงินจริงภายหลังได้ */}
            <Link className="btn btn-outline-secondary btn-sm" to="/">
              จองเพิ่ม
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-5">
      <div style={{ fontSize: 64, lineHeight: 1 }}>🗓️</div>
      <h5 className="mt-3">ยังไม่มีการจอง</h5>
      <p className="text-muted mb-3">เริ่มค้นหาห้องพักที่ถูกใจ แล้วกลับมาดูรายการจองที่นี่</p>
      <Link className="btn btn-primary" to="/">
        ไปหน้าค้นหา
      </Link>
    </div>
  );
}
