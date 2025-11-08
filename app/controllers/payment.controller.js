// app/controllers/payment.controller.js
"use strict";

const db = require("../models");

const Payment = db.payment;
const Booking = db.booking;
const User = db.user;
const Accommodation = db.accommodation;
const Receipt = db.receipt;

// ----- helpers -----
const now = () => new Date();
const isPosInt = (n) => Number.isInteger(n) && n > 0;
const hasAttr = (model, key) =>
  !!(model && model.rawAttributes && model.rawAttributes[key]);
const sum = (arr, pick) => arr.reduce((s, it) => s + Number(it[pick] || 0), 0);

async function getOrCreateReceiptForPayment(paymentId, t) {
  // ถ้ามีอยู่แล้ว คืนเลย
  const existing = await Receipt.findOne({ where: { paymentId }, transaction: t });
  if (existing) return existing;

  // ต้องมีข้อมูลประกอบ
  const bookings = await Booking.findAll({
    where: { paymentId },
    order: [["createdAt", "ASC"]],
    raw: true,
    transaction: t,
  });
  if (!bookings.length) return null;

  const userId = bookings[0].userId;
  const user = await User.findByPk(userId, {
    attributes: ["name", "lastname", "email", "phone"],
    raw: true,
    transaction: t,
  });

  const accIds = [...new Set(bookings.map((b) => b.accommodationId))];
  const accs = await Accommodation.findAll({
    where: { id: accIds },
    attributes: ["id", "name"],
    raw: true,
    transaction: t,
  });
  const accNameMap = new Map(accs.map((a) => [a.id, a.name]));

  const r = {
    userId,
    paymentId,
    bookingId: bookings[0]?.id ?? null,
    customerName: [user?.name, user?.lastname].filter(Boolean).join(" ") || "ลูกค้า",
    email: user?.email || "",
    phone: user?.phone || "",
    accommodationName: [...new Set(bookings.map(b => accNameMap.get(b.accommodationId) || "N/A"))].join(", "),
    // ช่องที่ตารางคุณมีจริง
    checkIn: bookings[0]?.checkInDate ? new Date(bookings[0].checkInDate) : null,
    checkOut: bookings[0]?.checkOutDate ? new Date(bookings[0].checkOutDate) : null,
    nights: sum(bookings, "totalNights"),
    numberOfRooms: sum(bookings, "numberOfRooms"),
    roomPricePerNight: bookings[0]?.pricePerNight || null,
    totalPrice: sum(bookings, "totalPrice"),
    discount: 0,
    extraCharge: 0,
    finalPrice: sum(bookings, "totalPrice"),
    paymentStatus: "Pending", // จะถูกฝั่ง FE/BE อัปเดตเป็น Paid ตามสถานะจริงได้
  };

  const rec = await Receipt.create(r, { transaction: t });
  return rec;
}

// =====================================================
// GET /api/payments
// =====================================================
async function getAllPayment(req, res) {
  try {
    const rows = await Payment.findAll({ order: [["id", "DESC"]] });
    res.json(rows);
  } catch (err) {
    console.error("getAllPayment error:", err);
    res.status(500).json({ message: "ดึงข้อมูลการชำระเงินไม่สำเร็จ" });
  }
}

// =====================================================
// GET /api/payments/user/:userId
// =====================================================
async function getPaymentByUserId(req, res) {
  const userId = Number(req.params.userId);
  if (!isPosInt(userId)) return res.status(400).json({ message: "userId ไม่ถูกต้อง" });
  try {
    const rows = await Payment.findAll({
      where: { userId },
      order: [["id", "DESC"]],
    });
    res.json(rows);
  } catch (err) {
    console.error("getPaymentByUserId error:", err);
    res.status(500).json({ message: "ดึงข้อมูลไม่สำเร็จ" });
  }
}

// =====================================================
// GET /api/payments/:id/status
// =====================================================
async function getPaymentStatus(req, res) {
  const id = Number(req.params.id);
  if (!isPosInt(id)) return res.status(400).json({ message: "payment id ไม่ถูกต้อง" });
  try {
    const pay = await Payment.findByPk(id);
    if (!pay) return res.status(404).json({ message: `ไม่พบ payment id=${id}` });
    res.json({ id: pay.id, status: pay.paymentStatus });
  } catch (err) {
    console.error("getPaymentStatus error:", err);
    res.status(500).json({ message: "ดึงสถานะไม่สำเร็จ" });
  }
}

// =====================================================
// POST /api/payments/:id/confirm
// ยืนยันการชำระเงิน → อัปเดต Payment(Paid) + Booking(Confirmed)
// และสร้างใบเสร็จถ้ายังไม่มี
// =====================================================
async function confirmBookingPayment(req, res) {
  const id = Number(req.params.id);
  if (!isPosInt(id)) return res.status(400).json({ message: "payment id ไม่ถูกต้อง" });

  const t = await db.sequelize.transaction();
  try {
    const pay = await Payment.findByPk(id, { transaction: t });
    if (!pay) {
      await t.rollback();
      return res.status(404).json({ message: `ไม่พบ payment id=${id}` });
    }

    // อัปเดตคอลัมน์ตามที่มีจริง
    const update = {};
    if (hasAttr(Payment, "paymentStatus")) update.paymentStatus = "Paid";
    if (hasAttr(Payment, "paid_at")) update.paid_at = now();
    if (Object.keys(update).length) await pay.update(update, { transaction: t });

    // อัปเดตสถานะ Booking ทั้งชุดที่ผูกกับ payment นี้
    const bookingUpdate = {};
    if (hasAttr(Booking, "bookingStatus")) bookingUpdate.bookingStatus = "Confirmed";
    if (Object.keys(bookingUpdate).length) {
      await Booking.update(bookingUpdate, { where: { paymentId: id }, transaction: t });
    }

    // ใบเสร็จ: ถ้ายังไม่มี ให้สร้าง
    const receipt = await getOrCreateReceiptForPayment(id, t);

    await t.commit();
    return res.json({
      message: "ยืนยันการชำระเงินสำเร็จ",
      payment: await Payment.findByPk(id),
      receiptId: receipt?.id || null,
    });
  } catch (err) {
    await t.rollback();
    console.error("confirmBookingPayment error:", err);
    return res.status(500).json({ message: "ยืนยันการชำระเงินไม่สำเร็จ" });
  }
}

// =====================================================
// POST /api/payments/:id/cancel
// =====================================================
async function cancelPayment(req, res) {
  const id = Number(req.params.id);
  if (!isPosInt(id)) return res.status(400).json({ message: "payment id ไม่ถูกต้อง" });

  try {
    const pay = await Payment.findByPk(id);
    if (!pay) return res.status(404).json({ message: `ไม่พบ payment id=${id}` });

    const update = {};
    if (hasAttr(Payment, "paymentStatus")) update.paymentStatus = "Cancelled";
    if (Object.keys(update).length) await pay.update(update);

    // Booking -> ยกเลิก
    const bookingUpdate = {};
    if (hasAttr(Booking, "bookingStatus")) bookingUpdate.bookingStatus = "Cancelled";
    if (Object.keys(bookingUpdate).length) {
      await Booking.update(bookingUpdate, { where: { paymentId: id } });
    }

    res.json({ message: "ยกเลิกรายการสำเร็จ" });
  } catch (err) {
    console.error("cancelPayment error:", err);
    res.status(500).json({ message: "ยกเลิกไม่สำเร็จ" });
  }
}

// =====================================================
// POST /api/payments/:id/fail
// =====================================================
async function failPayment(req, res) {
  const id = Number(req.params.id);
  if (!isPosInt(id)) return res.status(400).json({ message: "payment id ไม่ถูกต้อง" });

  try {
    const pay = await Payment.findByPk(id);
    if (!pay) return res.status(404).json({ message: `ไม่พบ payment id=${id}` });

    const update = {};
    if (hasAttr(Payment, "paymentStatus")) update.paymentStatus = "Failed";
    if (Object.keys(update).length) await pay.update(update);

    const bookingUpdate = {};
    if (hasAttr(Booking, "bookingStatus")) bookingUpdate.bookingStatus = "Pending";
    if (Object.keys(bookingUpdate).length) {
      await Booking.update(bookingUpdate, { where: { paymentId: id } });
    }

    res.json({ message: "เปลี่ยนสถานะเป็นล้มเหลวแล้ว" });
  } catch (err) {
    console.error("failPayment error:", err);
    res.status(500).json({ message: "อัปเดตไม่สำเร็จ" });
  }
}

module.exports = {
  getAllPayment,
  getPaymentByUserId,
  getPaymentStatus,
  confirmBookingPayment,
  cancelPayment,
  failPayment,
};
