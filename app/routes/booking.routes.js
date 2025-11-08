// app/routes/booking.routes.js
"use strict";

module.exports = (app) => {
  const router = require("express").Router();

  const bookingCtl = require("../controllers/booking.controller.js");
  const paymentCtl = require("../controllers/payment.controller.js");

  // ===== Debug receipts =====
  router.get("/receipts", bookingCtl.listReceipts);          // << ใหม่

  // ===== Booking =====
  router.post("/booking", bookingCtl.createMultiBooking);
  router.get("/receipt/latest/:userId", bookingCtl.receiptLatestByUser);
  router.get("/receipt/:id", bookingCtl.getReceiptById);

  // ===== Payment =====
  router.get("/payments", paymentCtl.getAllPayment);
  router.get("/payments/user/:userId", paymentCtl.getPaymentByUserId);
  router.get("/payments/:id/status", paymentCtl.getPaymentStatus);
  router.post("/payments/:id/confirm", paymentCtl.confirmBookingPayment);
  router.post("/payments/:id/cancel",  paymentCtl.cancelPayment);
  router.post("/payments/:id/fail",    paymentCtl.failPayment);
  router.get("/my-bookings/:userId", bookingCtl.getMyBookings);

  app.use("/api", router);
};
