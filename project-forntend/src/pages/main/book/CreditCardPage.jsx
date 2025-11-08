// src/pages/main/book/CreditCardPage.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Form, Button, Modal } from "react-bootstrap";
import AuthService from "@/services/auth/auth.service";
import BookingService from "@/services/api/booking/booking.service";

export default function CreditCardPage() {
  const { state = {} } = useLocation();
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();
  const [ok, setOk] = useState(false);
  const [form, setForm] = useState({ name: "", number: "", expiry: "", cvc: "" });

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (!user?.id) return navigate("/login");
      const payload = {
        userId: user.id,
        paymentMethod: "CreditCard",
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

      setOk(true);
      setTimeout(() => navigate("/my-bookings"), 2000);
    } catch (e2) {
      alert(e2?.response?.data?.message || "จ่ายเงินไม่สำเร็จ");
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: 560 }}>
      <h5 className="mb-3 text-center">กรุณากรอกข้อมูลให้ถูกต้องเพื่อจองห้องพัก</h5>
      <Form onSubmit={submit}>
        <Form.Group className="mb-2">
          <Form.Label>ชื่อบนบัตร</Form.Label>
          <Form.Control value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>หมายเลขบัตรเครดิต/เดบิต</Form.Label>
          <Form.Control maxLength={16} value={form.number}
                        onChange={e=>setForm({...form,number:e.target.value.replace(/\D/g,"")})}
                        required />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>วันหมดอายุ (MM/YY)</Form.Label>
          <Form.Control value={form.expiry} onChange={e=>setForm({...form,expiry:e.target.value})} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>CVV/CVC</Form.Label>
          <Form.Control maxLength={4} value={form.cvc}
                        onChange={e=>setForm({...form,cvc:e.target.value.replace(/\D/g,"")})}
                        required />
        </Form.Group>
        <div className="text-end">
          <Button type="submit" className="btn btn-info text-white">ยืนยัน</Button>
        </div>
      </Form>

      <Modal show={ok} centered>
        <Modal.Body className="text-center">
          <h5>✅ การชำระเงินเสร็จสิ้น</h5>
          <div>ระบบกำลังพากลับไปยัง “การจองของฉัน” …</div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
