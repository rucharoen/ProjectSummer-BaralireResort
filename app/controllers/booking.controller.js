"use strict";

const db = require("../models");

// Sequelize models
const Booking        = db.booking;
const Payment        = db.payment;
const User           = db.user;
const Accommodation  = db.accommodation;
const Receipt        = db.receipt || db.Receipt;

/* ------------------------ Helpers ------------------------ */
const isPosInt = (n) => Number.isInteger(n) && n > 0;
const dayDiff  = (a, b) => Math.ceil((b - a) / (1000 * 60 * 60 * 24));

/* =========================================================
 * DEBUG: list receipts
 * ========================================================*/
async function listReceipts(req, res) {
  try {
    const rows = await Receipt.findAll({
      attributes: [
        "id",
        "userId",
        "paymentId",
        "bookingId",
        "customerName",
        "accommodationName",
        "paymentStatus",
        "totalPrice",
        "createdAt",
      ],
      order: [["id","DESC"]],
      limit: 100,
    });
    return res.json({ count: rows.length, rows });
  } catch (err) {
    console.error("listReceipts error:", err);
    return res.status(500).json({ message: "ไม่สามารถดึงรายการใบเสร็จได้" });
  }
}

/* =========================================================
 * POST /api/booking
 * สร้างการจองหลายรายการ + Payment เดียว (Transaction)
 * ========================================================*/
async function createMultiBooking(req, res) {
  const { userId, bookings, paymentMethod } = req.body;

  if (!isPosInt(Number(userId))) {
    return res.status(400).json({ message: "userId ไม่ถูกต้อง" });
  }
  if (!Array.isArray(bookings) || bookings.length === 0) {
    return res.status(400).json({ message: "รูปแบบ bookings ต้องเป็น array และต้องมีอย่างน้อย 1 รายการ" });
  }
  if (!paymentMethod) {
    return res.status(400).json({ message: "กรุณาระบุ paymentMethod" });
  }

  const t = await db.sequelize.transaction();
  try {
    const user = await User.findByPk(userId, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(400).json({ message: `ไม่พบผู้ใช้ userId=${userId}` });
    }

    const accIds = [...new Set(
      bookings.map((b) => Number(b?.accommodationId)).filter((v) => isPosInt(v))
    )];
    if (accIds.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "accommodationId ของทุกรายการไม่ถูกต้อง" });
    }

    const accRows = await Accommodation.findAll({
      where: { id: accIds },
      attributes: ["id"],
      transaction: t,
    });
    const accSet  = new Set(accRows.map((a) => a.id));
    const missing = accIds.filter((id) => !accSet.has(id));
    if (missing.length) {
      await t.rollback();
      return res.status(400).json({ message: `ไม่พบห้องพัก (accommodationId): ${missing.join(", ")}` });
    }

    let grandTotal = 0;
    const prepared = [];

    for (let idx = 0; idx < bookings.length; idx++) {
      const it = bookings[idx] || {};
      const accommodationId = Number(it.accommodationId);
      const numberOfRooms   = Number(it.numberOfRooms);
      const adult           = Number(it.adult ?? 2);
      const child           = Number(it.child ?? 0);
      const pricePerNight   = Number(it.pricePerNight);
      const checkInDate     = new Date(it.checkInDate);
      const checkOutDate    = new Date(it.checkOutDate);

      const missingKeys = [];
      if (!isPosInt(accommodationId)) missingKeys.push("accommodationId");
      if (!isPosInt(numberOfRooms))   missingKeys.push("numberOfRooms");
      if (!it.checkInDate)            missingKeys.push("checkInDate");
      if (!it.checkOutDate)           missingKeys.push("checkOutDate");
      if (!(Number.isFinite(pricePerNight) && pricePerNight >= 0)) missingKeys.push("pricePerNight");

      if (missingKeys.length) {
        await t.rollback();
        return res.status(400).json({ message: `ข้อมูลการจองไม่ครบถ้วนที่ index ${idx}: ขาด ${missingKeys.join(", ")}` });
      }

      const totalNights = dayDiff(checkInDate, checkOutDate);
      if (totalNights <= 0) {
        await t.rollback();
        return res.status(400).json({ message: `ช่วงวันไม่ถูกต้องที่ index ${idx}` });
      }

      const totalPrice = totalNights * pricePerNight * numberOfRooms;
      grandTotal += totalPrice;

      prepared.push({
        userId,
        accommodationId,
        numberOfRooms,
        adult,
        child,
        checkInDate,
        checkOutDate,
        paymentMethod,
        totalNights,
        totalPrice,
        bookingStatus: "Pending",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    }

    const payment = await Payment.create(
      {
        userId,
        amount: grandTotal,
        paymentStatus: "Pending",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      { transaction: t }
    );

    const created = await Promise.all(
      prepared.map((b) =>
        Booking.create(
          { ...b, paymentId: payment.id },
          { transaction: t }
        )
      )
    );

    let receipt = null;
    try {
      const checkInMin  = new Date(Math.min(...created.map(b => new Date(b.checkInDate).getTime())));
      const checkOutMax = new Date(Math.max(...created.map(b => new Date(b.checkOutDate).getTime())));
      const nightsTotal = created.reduce((s, b) => s + Number(b.totalNights || 0), 0);
      const roomsTotal  = created.reduce((s, b) => s + Number(b.numberOfRooms || 0), 0);
      const totalPrice  = created.reduce((s, b) => s + Number(b.totalPrice || 0), 0);
      const denom       = created.reduce((s, b) => s + (Number(b.totalNights||0)*Number(b.numberOfRooms||0)), 0);
      const roomPricePerNight = denom > 0 ? (totalPrice / denom) : 0;

      const r = {
        userId,
        paymentId: payment.id,
        bookingId: created[0]?.id ?? null,
        customerName: [user?.name, user?.lastname].filter(Boolean).join(" ") || "ลูกค้า",
        email: user?.email || "",
        phone: user?.phone || "",
        accommodationName: "หลายรายการ",
        checkIn:  checkInMin,
        checkOut: checkOutMax,
        nights: nightsTotal,
        numberOfRooms: roomsTotal,
        roomPricePerNight,
        totalPrice,
        discount: 0,
        extraCharge: 0,
        finalPrice: totalPrice,
        paymentStatus: "Pending",
      };

      receipt = await db.receipt.create(r, { transaction: t });
    } catch (e) {
      console.warn("[createMultiBooking] สร้างใบเสร็จอัตโนมัติไม่สำเร็จ:", e?.message);
    }

    await t.commit();
    return res.status(201).json({
      message: "สร้างการจองสำเร็จ",
      payment_id: payment.id,
      booking_ids: created.map((b) => b.id),
      receipt_id: receipt?.id ?? null,
    });
  } catch (err) {
    await t.rollback();
    console.error("createMultiBooking error:", err);
    return res.status(500).json({ message: "ไม่สามารถสร้างการจองได้" });
  }
}

/* =========================================================
 * GET /api/receipt/latest/:userId
 * ========================================================*/
async function receiptLatestByUser(req, res) {
  const userId = Number(req.params.userId);
  if (!isPosInt(userId)) {
    return res.status(400).json({ message: "รหัสผู้ใช้ไม่ถูกต้อง" });
  }

  try {
    const payment = await Payment.findOne({
      where: { userId },
      order: [["createdAt", "DESC"]],
      raw: true,
    });
    if (!payment) {
      return res.status(404).json({ message: "ไม่พบข้อมูลการชำระเงินของผู้ใช้นี้" });
    }

    const existing = await Receipt.findOne({ where: { paymentId: payment.id }, raw: true });
    if (existing) {
      return res.status(200).json({ message: "มีใบเสร็จของการชำระเงินล่าสุดอยู่แล้ว", created: 0, receipt: existing });
    }

    const bookings = await Booking.findAll({
      where: { userId, paymentId: payment.id },
      order: [["createdAt", "DESC"]],
      raw: true,
    });
    if (!bookings.length) {
      return res.status(404).json({ message: "ไม่พบข้อมูลการจองของผู้ใช้นี้สำหรับการชำระเงินล่าสุด" });
    }

    const [user, accommodations] = await Promise.all([
      User.findByPk(userId, { attributes: ["name", "lastname", "email", "phone"], raw: true }),
      Accommodation.findAll({
        where: { id: [...new Set(bookings.map((b) => b.accommodationId))] },
        attributes: ["id", "name"],
        raw: true,
      }),
    ]);

    const accNameMap = new Map(accommodations.map((a) => [a.id, a.name]));
    const accommodationName =
      [...new Set(bookings.map((b) => accNameMap.get(b.accommodationId) || "N/A"))].join(", ");

    const nightsTotal = bookings.reduce((s, b) => s + Number(b.totalNights || 0), 0);
    const roomsTotal  = bookings.reduce((s, b) => s + Number(b.numberOfRooms || 0), 0);
    const totalPrice  = bookings.reduce((s, b) => s + Number(b.totalPrice || 0), 0);
    const checkInMin  = new Date(Math.min(...bookings.map(b => new Date(b.checkInDate).getTime())));
    const checkOutMax = new Date(Math.max(...bookings.map(b => new Date(b.checkOutDate).getTime())));
    const denom       = bookings.reduce((s, b) => s + (Number(b.totalNights||0)*Number(b.numberOfRooms||0)), 0);
    const roomPricePerNight = denom > 0 ? (totalPrice / denom) : 0;

    const r = {
      userId,
      paymentId: payment.id,
      bookingId: bookings[0]?.id ?? null,
      customerName: `${user?.name || ""} ${user?.lastname || ""}`.trim(),
      email: user?.email || "",
      phone: user?.phone || "",
      accommodationName,
      checkIn:  checkInMin,
      checkOut: checkOutMax,
      nights: nightsTotal,
      numberOfRooms: roomsTotal,
      roomPricePerNight,
      totalPrice,
      discount: 0,
      extraCharge: 0,
      finalPrice: totalPrice,
      paymentStatus: "Pending",
    };

    const saved = await db.receipt.create(r);
    return res.status(201).json({ message: "สร้างใบเสร็จสำเร็จ", created: 1, receipt: saved });
  } catch (err) {
    console.error("receiptLatestByUser fatal:", err?.name, err?.message);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดระหว่างสร้างใบเสร็จ" });
  }
}

/* =========================================================
 * GET /api/receipt/:id
 * ========================================================*/
async function getReceiptById(req, res) {
  const id = Number(req.params.id);
  if (!isPosInt(id)) {
    return res.status(400).json({ message: "รหัสใบเสร็จไม่ถูกต้อง" });
  }

  try {
    const row = await Receipt.findByPk(id);
    if (!row) return res.status(404).json({ message: `ไม่พบใบเสร็จ id=${id}` });
    return res.json(row);
  } catch (err) {
    console.error("getReceiptById error:", err);
    return res.status(500).json({ message: "ไม่สามารถดึงข้อมูลใบเสร็จได้" });
  }
}

/* =========================================================
 * GET /api/my-bookings/:userId
 * ========================================================*/
async function getMyBookings(req, res) {
  const userId = Number(req.params.userId);
  if (!isPosInt(userId)) {
    return res.status(400).json({ message: "รหัสผู้ใช้ไม่ถูกต้อง" });
  }

  try {
    const rows = await Booking.findAll({
      where: { userId },
      attributes: [
        "id", "accommodationId", "numberOfRooms", "adult", "child",
        "checkInDate", "checkOutDate", "totalNights", "totalPrice",
        "bookingStatus", "paymentMethod", "createdAt"
      ],
      include: [
        { model: Accommodation, attributes: ["id", "name", "image_name", "price_per_night"] },
        { model: Payment, as: "payment", attributes: ["id", "paymentStatus"] }
      ],
      order: [["createdAt", "DESC"]],
    });

    const data = rows.map(r => ({
      id: r.id,
      bookingStatus: r.bookingStatus,
      paymentMethod: r.paymentMethod,
      totalPrice: r.totalPrice,
      totalNights: r.totalNights,
      numberOfRooms: r.numberOfRooms,
      guests: { adult: r.adult, child: r.child },
      period: { checkIn: r.checkInDate, checkOut: r.checkOutDate },
      createdAt: r.createdAt,
      accommodation: {
        id: r.accommodation?.id ?? null,
        name: r.accommodation?.name ?? "-",
        image: r.accommodation?.image_name
          ? `${process.env.BASE_URL || "http://localhost:5000"}/uploads/accommodations/${encodeURIComponent(r.accommodation.image_name)}`
          : "https://picsum.photos/id/57/800/600",
        pricePerNight: r.accommodation?.price_per_night ?? null,
      },
      payment: {
        id: r.payment?.id ?? null,
        status: r.payment?.paymentStatus ?? "Pending",
      },
    }));

    return res.json({ count: data.length, rows: data });
  } catch (err) {
    console.error("getMyBookings error:", err);
    return res.status(500).json({ message: "ไม่สามารถดึงข้อมูลการจองได้" });
  }
}

/* =========================================================
 * EXPORT
 * ========================================================*/
module.exports = {
  listReceipts,
  createMultiBooking,
  receiptLatestByUser,
  getReceiptById,
  getMyBookings,
};
