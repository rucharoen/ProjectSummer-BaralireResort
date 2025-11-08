// src/pages/main/book/QRCodePage.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Modal } from "react-bootstrap";
import AuthService from "@/services/auth/auth.service";
import BookingService from "@/services/api/booking/booking.service";

export default function QRCodePage() {
  const { state = {} } = useLocation();
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();
  const [show, setShow] = useState(false);

  // ชำระด้วยพร้อมเพย์: create -> confirm -> generateReceipt -> popup -> ไป my-bookings
  const doPay = async () => {
    try {
      if (!user?.id) return navigate("/login");
      const payload = {
        userId: user.id,
        paymentMethod: "PromptPay",
        bookings: [{
          accommodationId: state.id,
          numberOfRooms: state.rooms,
          adult: state.adults,
          child: state.children,
          checkInDate: state.checkIn,
          checkOutDate: state.checkOut,
          pricePerNight: state.price,
        }],
      };
      const { data } = await BookingService.create(payload);
      const paymentId = data?.payment?.id;

      if (paymentId) await BookingService.confirmPayment(paymentId);
      await BookingService.generateReceipt(user.id);

      setShow(true);
      setTimeout(() => navigate("/my-bookings"), 2000);
    } catch (e) {
      alert(e?.response?.data?.message || "ทำรายการไม่สำเร็จ");
    }
  };

  useEffect(() => {
    // สามารถ auto-start ได้ถ้าต้องการ
  }, []);

  const amount = (Number(state.price || 0) * Number(state.rooms || 1)) || 0;

  return (
    <div className="container py-4 text-center">
      <h4>สแกน QR Code เพื่อชำระเงิน</h4>
      <img
        alt="QR code"
        width={260}
        src={`https://promptpay.io/0891234567/${amount}.png`}
        className="my-3"
      />
      <div>
        <Button onClick={doPay}>ฉันชำระเงินแล้ว</Button>
      </div>

      <Modal show={show} centered>
        <Modal.Body className="text-center">
          <h5>✅ การชำระเงินเสร็จสิ้น</h5>
          <div>ระบบกำลังพากลับไปยัง “การจองของฉัน” …</div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
