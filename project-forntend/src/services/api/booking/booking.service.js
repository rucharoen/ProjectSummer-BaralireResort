import api from "@/services/http";

const BookingService = {
  create(payload) {
    // POST /api/booking  => { payment_id, booking_ids, receipt_id? }
    return api.post("/api/booking", payload);
  },

  confirmPayment(paymentId) {
    // POST /api/payments/:id/confirm
    return api.post(`/api/payments/${paymentId}/confirm`);
  },

  getMyBookings(userId) {
    // GET /api/my-bookings/:userId
    return api.get(`/api/my-bookings/${userId}`);
  },

  generateReceipt(userId) {
    // GET /api/receipt/latest/:userId  (สร้างใบเสร็จจาก payment ล่าสุดถ้ายังไม่มี)
    return api.get(`/api/receipt/latest/${userId}`);
  },

  getReceiptById(id) {
    return api.get(`/api/receipt/${id}`);
  },
};

export default BookingService;
