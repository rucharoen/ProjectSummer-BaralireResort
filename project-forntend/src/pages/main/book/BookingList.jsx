// src/pages/main/book/BookingList.jsx
import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import AuthService from "@/services/auth/auth.service";
import BookingService from "@/services/api/booking/booking.service";

export default function MyBookingList() {
  const user = AuthService.getCurrentUser();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user?.id) return;
      try {
        const { data } = await BookingService.getMine(user.id);
        if (alive) setRows(data || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
  }, [user?.id]);

  if (!user) return <div className="container py-5">กรุณาเข้าสู่ระบบ</div>;
  if (loading) return <div className="container py-5">กำลังโหลด…</div>;

  return (
    <div className="container py-4">
      <h3 className="mb-3">การจองของฉัน</h3>
      {rows.length === 0 && <div className="text-muted">ยังไม่มีการจอง</div>}

      <ul className="list-group">
        {rows.map((b) => (
          <li key={b.id} className="list-group-item d-flex justify-content-between align-items-start">
            <div>
              <div className="fw-semibold">{b.accommodation?.name || `หมายเลขห้องพัก #${b.id}`}</div>
              <div className="small text-muted">
                {dayjs(b.checkInDate).format("DD MMM YYYY")} – {dayjs(b.checkOutDate).format("DD MMM YYYY")}
                {" · "}ห้อง {b.numberOfRooms} · ผู้ใหญ่ {b.adult}{b.child ? ` · เด็ก ${b.child}` : ""}
              </div>
              <div className="small">สถานะการจอง: <b>{b.bookingStatus}</b> · ชำระเงิน: <b>{b.payment?.paymentStatus}</b></div>
            </div>
            <div className="text-end">
              <div className="fw-bold">{Number(b.totalPrice || 0).toLocaleString()}</div>
              {b.receiptId && (
                <a
                  href={`${import.meta.env.VITE_BASE_URL}/api/receipt/pdf/${b.receiptId}`}
                  className="btn btn-sm btn-outline-primary mt-2"
                >
                  ใบเสร็จรับเงิน
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
