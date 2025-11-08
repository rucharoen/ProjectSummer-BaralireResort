// src/pages/main/book/BookPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Modal, Button, Form, Card, Spinner } from "react-bootstrap";
import AuthService from "@/services/auth/auth.service";
import BookingService from "@/services/api/booking/booking.service";
import FormatToBE from "@/utils/FormatToBE";
import promptpay from "@/assets/promptpay.png";
import bank from "@/assets/bank.png";
import "./BookPage.css";

const QR_ACCOUNT = "0891234567"; // โทร/พร้อมเพย์ที่ใช้สร้าง QR Demo

export default function BookPage() {
  const { state = {} } = useLocation();
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();

  // กันเข้าหน้าโดยไม่มี state จาก SearchPage
  useEffect(() => {
    if (!state?.id || !state?.checkIn || !state?.checkOut) {
      navigate("/", { replace: true });
    }
  }, []); // eslint-disable-line

  // ===== ค่าเริ่มต้นที่รับมาจาก SearchPage =====
  const accId = state.id;
  const name = state.name || "ไม่ระบุชื่อห้อง";
  const image = state.image || "https://picsum.photos/id/57/800/600";
  const pricePerNight = Number(state.price || 0);
  const checkIn = state.checkIn || "";
  const checkOut = state.checkOut || "";
  const initRooms = Number(state.rooms || 1);
  const initAdults = Number(state.adults || 2);
  const initChildren = Number(state.children || 0);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const d = Math.ceil(
      (new Date(checkOut).setHours(12, 0, 0, 0) -
        new Date(checkIn).setHours(12, 0, 0, 0)) / 86400000
    );
    return Math.max(0, d);
  }, [checkIn, checkOut]);

  // ===== UI state =====
  const [step, setStep] = useState(1); // 1=สรุป, 2=จ่าย
  const [isCredit, setIsCredit] = useState(false); // false=PromptPay
  const [agreed, setAgreed] = useState(false);
  const [rooms, setRooms] = useState(initRooms);
  const [adults, setAdults] = useState(initAdults);
  const [children, setChildren] = useState(initChildren);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  // Popup: ดูรายละเอียด/แก้ไข
  const [showEdit, setShowEdit] = useState(false);
  const [showPaid, setShowPaid] = useState(false);

  const total = useMemo(
    () => Math.max(0, rooms) * Math.max(0, nights) * pricePerNight,
    [rooms, nights, pricePerNight]
  );

  const buildPayload = () => ({
    userId: user?.id,
    paymentMethod: isCredit ? "CreditCard" : "PromptPay",
    bookings: [
      {
        accommodationId: accId,
        numberOfRooms: rooms,
        adult: adults,
        child: children,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        pricePerNight,
        requestNote: note || undefined,
      },
    ],
  });

  // ===== ขั้นตอนทำธุรกรรม (ทั้ง QR/บัตร) =====
  const doPay = async () => {
    try {
      if (!user?.id) return navigate("/login", { replace: true });
      if (nights <= 0) return alert("ช่วงวันไม่ถูกต้อง");

      setLoading(true);

      // สร้าง Booking + Payment (+ อาจมี receipt_id กลับมาเลย)
      // NOTE: Service ของคุณเดิมใช้ชื่อ create() ชี้ไป POST /api/booking อยู่แล้ว
      const { data } = await BookingService.create(buildPayload());

      // ยืนยันการชำระ (สถานะ payment -> Paid) ถ้ามี payment id
      const paymentId = data?.payment_id || data?.payment?.id;
      if (paymentId) {
        await BookingService.confirmPayment(paymentId);
      }

      // รับ id ใบเสร็จ
      let receiptId = data?.receipt_id;

      // ถ้า backend ยังไม่ได้สร้างใบเสร็จในทันที ให้ยิงขอสร้าง/ดึงล่าสุดแทน
      if (!receiptId) {
        const gen = await BookingService.generateReceipt(user.id); // GET /api/receipt/latest/:userId
        receiptId = gen?.data?.receipt?.id;
      }

      setShowPaid(true);

// ✅ เพิ่มเวลารอก่อนเปลี่ยนหน้า 3 วินาที
setTimeout(() => {
  if (receiptId) {
    navigate(`/receipt/${receiptId}`);
  } else {
    alert("บันทึกสำเร็จ แต่ยังไม่พบใบเสร็จล่าสุด");
    navigate("/my-bookings");
  }
}, 3000);

    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "ทำรายการไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // ====== UI Handlers ======
  const nextToPay = () => {
    if (!user?.id) return navigate("/login", { replace: true });
    if (!agreed || nights <= 0) return;
    setStep(2);
  };

  const amountQR = useMemo(() => {
    // QR แสดงยอดรวมเฉพาะค่าห้อง (ตัวอย่าง)
    return pricePerNight * rooms * nights || 0;
  }, [pricePerNight, rooms, nights]);

  return (
    <div className="bp">
      {/* Steps */}
      <div className="bp-steps">
        <span className="bp-steps__label">ขั้นตอนที่:</span>
        <div className={`bp-step ${step === 1 ? "is-active" : ""}`}>1</div>
        <div className={`bp-step ${step === 2 ? "is-active" : ""}`}>2</div>
      </div>

      <div className="container">
        {step === 1 && (
          <div className="row g-4">
            {/* ซ้าย: วิธีชำระเงิน + หมายเหตุ */}
            <div className="col-lg-5">
              <Card className="bp-card">
                <img className="bp-cover" src={image} alt={name} />

                <div className="bp-section-title">เลือกวิธีการชำระเงิน</div>

                <button
                  type="button"
                  className={`bp-pay ${!isCredit ? "is-active" : ""}`}
                  onClick={() => setIsCredit(false)}
                >
                  <Form.Check
                    type="radio"
                    name="pay"
                    checked={!isCredit}
                    readOnly
                    className="m-0"
                  />
                  <img src={promptpay} alt="" className="bp-pay__icon" />
                  <span className="fw-bold">พร้อมเพย์</span>
                </button>

                <button
                  type="button"
                  className={`bp-pay ${isCredit ? "is-active" : ""}`}
                  onClick={() => setIsCredit(true)}
                >
                  <Form.Check
                    type="radio"
                    name="pay"
                    checked={isCredit}
                    readOnly
                    className="m-0"
                  />
                  <img src={bank} alt="" className="bp-pay__icon" />
                  <span className="fw-bold">บัตรเครดิต</span>
                </button>

                <div className="bp-note">
                  <div className="bp-note__label">คำขอพิเศษ</div>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="เช่น ประเภทเตียง หรือ สถานที่รับส่ง"
                    className="bp-textarea"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <div className="bp-note__warn">
                    * ไม่รับประกันคำขอพิเศษ แต่คำขอของท่านจะได้รับการดูแลอย่างดีที่สุดตามที่เป็นไปได้
                  </div>
                </div>
              </Card>
            </div>

            {/* ขวา: สรุปรายการ */}
            <div className="col-lg-7">
              <Card className="bp-card bp-card--sticky">
                <div className="bp-summary">
                  <div className="bp-summary__title">สรุปรายการจอง</div>

                  <div className="bp-hotel">
                    <div className="bp-hotel__name">บาราลี บีช รีสอร์ท แอนด์ สปา</div>
                    <div className="bp-hotel__meta">จังหวัดตราด ประเทศไทย</div>
                  </div>

                  <div className="bp-row">
                    <div>
                      <b>{nights} คืน:</b> {FormatToBE(checkIn)} - {FormatToBE(checkOut)}
                    </div>
                    <div>ห้อง: {name}</div>
                  </div>

                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() => setShowEdit(true)}
                    >
                      ดูรายละเอียด/แก้ไข
                    </Button>
                    <small className="text-muted">
                      ผู้ใหญ่ {adults} · เด็ก {children} · ห้อง {rooms}
                    </small>
                  </div>

                  <div className="bp-total">
                    <div className="bp-total__label">ยอดรวมสุทธิ</div>
                    <div className="bp-total__amount">
                      {total.toLocaleString()} <small>บาท</small>
                    </div>
                    <div className="bp-total__sub">รวมภาษีและค่าธรรมเนียม</div>
                  </div>

                  <Form.Check
                    type="checkbox"
                    id="agree"
                    label={
                      <>
                        ฉันได้อ่านและยอมรับ{" "}
                        <a href="#!" className="bp-link">
                          ข้อตกลงและเงื่อนไข
                        </a>
                      </>
                    }
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-2"
                  />

                  <div className="bp-actions">
                    <Button
                      className="bp-btn-cancel"
                      onClick={() => navigate(-1)}
                      disabled={loading}
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      className="bp-btn-book"
                      disabled={!agreed || loading || nights <= 0}
                      onClick={nextToPay}
                    >
                      {loading ? <Spinner size="sm" /> : "ทำการจอง →"}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="row justify-content-center">
            <div className="col-lg-7">
              <Card className="bp-card text-center py-4">
                {!isCredit ? (
                  <>
                    <h5 className="mb-3">สแกน QR Code เพื่อชำระเงิน</h5>
                    <img
                      alt="QR code"
                      width={300}
                      height={300}
                      className="mx-auto my-2"
                      src={`https://promptpay.io/${QR_ACCOUNT}/${amountQR}.png`}
                    />
                    <div className="text-muted mb-3">
                      กรุณาชำระภายใน 24 ชั่วโมง • ยอด {amountQR.toLocaleString()} บาท
                    </div>
                    <div className="d-flex gap-2 justify-content-center">
                      <Button
                        variant="outline-secondary"
                        onClick={() => setStep(1)}
                        disabled={loading}
                      >
                        ← ย้อนกลับ
                      </Button>
                      <Button onClick={doPay} disabled={loading}>
                        {loading ? "กำลังบันทึก..." : "ฉันชำระเงินแล้ว"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <h5 className="mb-3">กรุณากรอกข้อมูลบัตรเพื่อจองห้องพัก</h5>
                    <div className="cc-wrap">
                      <div className="cc-left">
                        <Form.Group className="mb-2">
                          <Form.Label>ชื่อบนบัตร</Form.Label>
                          <Form.Control required placeholder="FULL NAME" />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label>หมายเลขบัตรเครดิต/เดบิต</Form.Label>
                          <Form.Control inputMode="numeric" maxLength={16} />
                        </Form.Group>
                        <div className="d-flex gap-2">
                          <Form.Group className="flex-fill">
                            <Form.Label>วันหมดอายุ (MM/YY)</Form.Label>
                            <Form.Control placeholder="MM/YY" />
                          </Form.Group>
                          <Form.Group style={{ width: 140 }}>
                            <Form.Label>CVV/CVC</Form.Label>
                            <Form.Control inputMode="numeric" maxLength={4} />
                          </Form.Group>
                        </div>
                      </div>
                      <div className="cc-right">
                        <div className="cc-card" aria-hidden />
                      </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-end mt-3">
                      <Button
                        variant="outline-secondary"
                        onClick={() => setStep(1)}
                        disabled={loading}
                      >
                        ← ย้อนกลับ
                      </Button>
                      <Button onClick={doPay} disabled={loading}>
                        {loading ? "กำลังชำระเงิน..." : "ยืนยัน"}
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* ===== Modal: ดูรายละเอียด/แก้ไข ===== */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title> {name} </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="rd-grid">
            <div className="rd-left">
              <div className="rd-rate">
                ราคา: <b>ซัมเมอร์ดีล ลด 58%</b> ({nights} คืน)
              </div>

              <div className="rd-section">รายละเอียด</div>
              <div className="rd-row">
                <div className="rd-cell muted">{FormatToBE(checkIn)}</div>
                <div className="rd-cell right">
                  {(pricePerNight * rooms).toLocaleString()}
                </div>
              </div>

              <div className="rd-section">ราคาสรุม</div>
              <div className="rd-row">
                <div className="rd-cell">ยอดรวม</div>
                <div className="rd-cell right">{total.toLocaleString()}</div>
              </div>

              <div className="rd-includes">
                <div className="rd-inc-title">ราคานี้รวม:</div>
                <ul className="rd-ul">
                  <li>อาหารเช้า 2 ท่าน</li>
                  <li>ฟรี Wi-Fi</li>
                  <li>ที่จอดรถ</li>
                </ul>
              </div>
            </div>

            <div className="rd-right">
              <div className="rd-qty">
                <label>จำนวนห้อง:</label>
                <Qty value={rooms} onChange={setRooms} min={1} />
              </div>
              <div className="rd-qty">
                <label>ผู้ใหญ่:</label>
                <Qty value={adults} onChange={setAdults} min={1} />
              </div>
              <div className="rd-qty">
                <label>เด็ก:</label>
                <Qty value={children} onChange={setChildren} min={0} />
              </div>

              <div className="rd-total-box">
                <div className="rd-total-label">ยอดรวม (THB)</div>
                <div className="rd-total-amount">{total.toLocaleString()}</div>
              </div>

              <div className="text-end">
                <Button onClick={() => setShowEdit(false)}>ยืนยัน</Button>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* Success popup หลังชำระ */}
      <Modal show={showPaid} onHide={() => setShowPaid(false)} centered>
        <Modal.Body className="text-center">
          <h5>✅ การชำระเงินเสร็จสิ้น</h5>
          <div>กำลังพาไปหน้าใบเสร็จ…</div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

/* ====== Small qty stepper ====== */
function Qty({ value, onChange, min = 0 }) {
  const inc = () => onChange((n) => n + 1);
  const dec = () => onChange((n) => Math.max(min, n - 1));
  return (
    <div className="qty">
      <button type="button" className="qty-btn" onClick={dec} aria-label="ลด">
        −
      </button>
      <div className="qty-val">{value}</div>
      <button type="button" className="qty-btn" onClick={inc} aria-label="เพิ่ม">
        +
      </button>
    </div>
  );
}
