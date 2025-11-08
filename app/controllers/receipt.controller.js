const db = require("../models");
const { Sequelize } = db;
const Receipt = db.receipt || db.Receipt;

const Payment = db.payment;
const Booking = db.bookings;

// สร้างใบเสร็จจาก payment ล่าสุดของผู้ใช้ ถ้ายังไม่มี
exports.ensureByUser = async (req, res) => {
  try {
    const userId = Number(req.params.userId || req.body.userId);
    if (!userId) return res.status(400).json({ message: "userId is required" });

    // payment ล่าสุดของ user
    const payment = await Payment.findOne({
      where: { user_id: userId },
      order: [["createdAt", "DESC"]],
    });
    if (!payment) return res.status(404).json({ message: "no payment for this user" });

    // มีใบเสร็จอยู่แล้ว?
    let receipt = await Receipt.findOne({ where: { payment_id: payment.id } });
    if (!receipt) {
      // รวมยอดจาก bookings ที่ผูกกับ payment นี้
      const bookings = await Booking.findAll({ where: { paymentId: payment.id } }); // ถ้าใช้คอลัมน์ snake_case ให้เป็น payment_id
      const total = bookings.reduce((sum, b) => {
        // ถ้ามี totalPrice ใช้อันนั้น, ถ้าไม่มีก็คิดจาก nightly
        const nights = Number(b.totalNights || 0);
        const qty = Number(b.numberOfRooms || 1);
        const p = Number(b.pricePerNight || 0);
        const maybeTotal = Number(b.totalPrice || 0);
        return sum + (maybeTotal > 0 ? maybeTotal : p * nights * qty);
      }, 0);

      receipt = await Receipt.create({
        user_id: userId,
        payment_id: payment.id,
        total_amount: total,
        // payment_status: payment.paymentStatus,  
        receipt_date: new Date(),
      });
    }

    // ตอบกลับใบเสร็จล่าสุด (ที่มี/ที่พึ่งสร้าง)
    const full = await Receipt.findOne({
      where: { id: receipt.id },
      include: [{ model: Payment, attributes: ["id", "paymentStatus", "due_Date", "paid_at", "user_id"] }],
    });
    return res.json(full);
  } catch (err) {
    console.error("ensureByUser error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};
