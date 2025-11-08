// app/controllers/accommodation.controller.js
const db = require("../models");
const { Op, fn, col } = require("sequelize");

// ใช้คีย์ตัวเล็กจาก db/index.js (ถ้ามีตัวใหญ่ก็ fallback ให้)
const Accommodation = db.accommodation || db.Accommodation;
const Type          = db.type          || db.Type;
const User          = db.user          || db.User;
const Booking       = db.booking       || db.Booking;
const Promotion     = db.promotion     || db.Promotion;
const Payment       = db.payment       || db.Payment;
const RatePlan      = db.ratePlan      || db.RatePlan;

/* =========================
   GET /api/accommodation
========================= */
exports.getAll = async (_req, res) => {
  try {
    const rows = await Accommodation.findAll({
      include: [{ model: Type, attributes: ["name"] }],
      order: [["id", "ASC"]],
    });
    res.status(200).json(rows);
  } catch (err) {
    console.error("getAll error:", err);
    res.status(500).json({ message: "Error fetching accommodations" });
  }
};

/* ==========================================
   GET /api/accommodation/search
   ?destination=&guests=&checkIn=&checkOut=&onlyAvailable=true
========================================== */
exports.getSearch = async (req, res) => {
  try {
    const { destination, guests, checkIn, checkOut, onlyAvailable } = req.query;
    if (!checkIn || !checkOut) {
      return res
        .status(400)
        .json({ message: "Please provide checkIn and checkOut dates." });
    }

    const parsedCheckIn  = new Date(checkIn);
    const parsedCheckOut = new Date(checkOut);

    const includeCondition = {
      model: Type,
      attributes: ["id", "name"],
      required: true,
    };
    if (destination && destination !== "ทั้งหมด" && destination.toLowerCase() !== "all") {
      includeCondition.where = { name: { [Op.like]: `${destination}%` } };
    }

    const accommodations = await Accommodation.findAll({
      include: [includeCondition],
      attributes: { exclude: ["createdAt", "updatedAt"] },
      where: guests ? { capacity: { [Op.gte]: parseInt(guests, 10) } } : undefined,
      order: [["id", "ASC"]],
    });

    // หา booking ที่ชนกับช่วงวันและยัง active (จ่ายแล้ว หรือ pending แต่ยังไม่พ้นกำหนด)
    const bookings = await Booking.findAll({
      include: [{
        model: Payment,
        as: "payment",
        required: true,
        where: {
          [Op.or]: [
            { paymentStatus: "Paid" },
            { paymentStatus: "Pending", due_Date: { [Op.gte]: new Date() } },
          ],
        },
      }],
      where: {
        isCancelled: false,
        checkInDate:  { [Op.lte]: parsedCheckOut },
        checkOutDate: { [Op.gte]: parsedCheckIn },
      },
    });

    // รวมจำนวนห้องที่ถูกจองต่อ accommodation
    const bookingCount = {};
    bookings.forEach(b => {
      const accId = b.accommodationId;
      const roomsBooked = b.numberOfRooms || 1;
      bookingCount[accId] = (bookingCount[accId] || 0) + roomsBooked;
    });

    const results = accommodations.map(acc => {
      const bookedRooms    = bookingCount[acc.id] || 0;
      const availableRooms = Math.max((acc.total_rooms || 0) - bookedRooms, 0);

      const discount        = acc.discount ?? 0;
      const pricePerNight   = Number(acc.price_per_night || 0);
      const priceAfterDisc  = pricePerNight * (1 - discount / 100);

      return {
        ...acc.toJSON(),
        availableRooms,
        priceAfterDiscount: Number(priceAfterDisc.toFixed(2)),
      };
    });

    const finalResults = (onlyAvailable === "true")
      ? results.filter(acc => acc.availableRooms > 0)
      : results;

    res.status(200).json(finalResults);
  } catch (err) {
    console.error("getSearch error:", err);
    res.status(500).json({ message: "Error searching accommodations" });
  }
};

/* ====================================
   GET /api/accommodation/booking
==================================== */
exports.getAllBookings = async (_req, res) => {
  try {
    const rows = await Booking.findAll({
      attributes: [
        "adult",
        "child",
        "checkInDate",
        "checkOutDate",
        "totalNights",
        "totalPrice",
        "extraBed",
        "doubleExtraBed",
        "numberOfRooms",
      ],
      include: [
        { model: Accommodation, attributes: ["name"] },
        { model: User, attributes: ["name", "lastname", "email"] },
        { model: Promotion, attributes: ["percent"], through: { attributes: [] } },
      ],
      order: [["createdAt", "DESC"]],
    });

    const enriched = rows.map(booking => {
      const adult  = booking.adult;
      const child  = booking.child;
      const nights = booking.totalNights;
      const basePrice = Number(booking.totalPrice || 0);
      const promotion = booking.promotions?.[0];
      const percent   = promotion?.percent || 0;
      const numberOfRooms = booking.numberOfRooms || 1;

      const roomPriceTotal      = basePrice * nights * numberOfRooms;
      const discountedRoomPrice = roomPriceTotal * (1 - percent / 100);

      let extraPersonCharge = 0;
      let extraBedCharge    = booking.extraBed ? 200 : 0;
      let doubleExtraBedCharge = booking.doubleExtraBed ? 500 : 0;

      if (adult === 1) {
        if (child > 3) return { ...booking.toJSON(), error: "ไม่สามารถมีเด็กมากกว่า 3 คนได้ถ้ามีผู้ใหญ่เพียง 1 คน" };
        if (child === 3) extraPersonCharge += 749;
      } else if (adult === 2) {
        if (child > 1) return { ...booking.toJSON(), error: "ไม่สามารถมีเด็กมากกว่า 1 คนได้ถ้ามีผู้ใหญ่ 2 คน" };
        if (child === 1) extraPersonCharge += 749;
      } else if (adult === 3) {
        if (child > 1) return { ...booking.toJSON(), error: "ไม่สามารถมีเด็กมากกว่า 1 คนได้ถ้ามีผู้ใหญ่ 3 คน" };
        extraPersonCharge += 1000;
        if (child === 1) extraPersonCharge += 749;
      } else if (adult > 3) {
        return { ...booking.toJSON(), error: "ไม่สามารถมีผู้ใหญ่เกิน 3 คนต่อห้องได้" };
      }

      const extraCharge = extraPersonCharge + extraBedCharge + doubleExtraBedCharge;
      const finalPrice  = discountedRoomPrice + extraCharge;

      return {
        ...booking.toJSON(),
        roomPriceTotal:      roomPriceTotal.toFixed(2),
        discountedRoomPrice: discountedRoomPrice.toFixed(2),
        extraCharge,
        extraDetails: { extraPersonCharge, extraBedCharge, doubleExtraBedCharge },
        discountPercent: percent,
        finalPrice:        finalPrice.toFixed(2),
      };
    });

    res.status(200).json(enriched);
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ message: "Error retrieving bookings." });
  }
};

/* ============================================
   GET /api/accommodation/promotion
============================================ */
exports.getAllPromotion = async (_req, res) => {
  try {
    const rows = await Promotion.findAll({
      attributes: ["id", "condition", "percent", "period", "description"],
      include: [{ model: Type, attributes: ["name", "details"] }],
    });
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching promotions:", err);
    res.status(500).json({ message: "ไม่สามารถดึงข้อมูลโปรโมชั่นได้" });
  }
};

/* =========================================================
   GET /api/accommodation/availableroom?checkIn=&checkOut=
========================================================= */
exports.getAvailability = async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;
    const parsedCheckIn  = new Date(checkIn);
    const parsedCheckOut = new Date(checkOut);
    const now = new Date();

    const accommodations = await Accommodation.findAll();

    const bookings = await Booking.findAll({
      include: [{
        model: Payment,
        as: "payment",
        required: true,
        where: {
          [Op.or]: [
            { paymentStatus: "Paid" },
            { paymentStatus: "Pending", due_Date: { [Op.gte]: now } },
          ],
        },
      }],
      where: {
        [Op.and]: [
          { checkInDate:  { [Op.lte]: parsedCheckOut } },
          { checkOutDate: { [Op.gte]: parsedCheckIn } },
        ],
        isCancelled: false,
      },
    });

    const bookedCountByAccommodation = {};
    bookings.forEach(b => {
      const accId = b.accommodationId;
      const amount = b.numberOfRooms || 1;
      bookedCountByAccommodation[accId] = (bookedCountByAccommodation[accId] || 0) + amount;
    });

    const availability = accommodations.map(acc => {
      const bookedRooms    = bookedCountByAccommodation[acc.id] || 0;
      const totalRooms     = acc.total_rooms || 0;
      const availableRooms = Math.max(totalRooms - bookedRooms, 0);
      return {
        accommodationName: acc.name,
        total_rooms: totalRooms,
        bookedRooms,
        availableRooms,
      };
    });

    res.status(200).json({ success: true, data: availability });
  } catch (err) {
    console.error("getAvailability error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* =======================================================
   GET /api/accommodation/:id/rating
======================================================= */
exports.getAccommodationRating = async (req, res) => {
  try {
    const accommodationId = req.params.id;
    const result = await Booking.findOne({
      attributes: [
        [fn("AVG", col("checkOutRating")), "avgRating"],
        [fn("COUNT", col("checkOutRating")), "totalReviews"],
      ],
      where: {
        accommodationId,
        checkOutRating: { [Op.not]: null },
      },
    });

    const avgRating    = Number(result?.dataValues?.avgRating || 0).toFixed(1);
    const totalReviews = parseInt(result?.dataValues?.totalReviews || 0, 10);

    res.json({ avgRating, totalReviews });
  } catch (err) {
    console.error("getAccommodationRating error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงคะแนน" });
  }
};

exports.getWithRates = async (req, res) => {
  try {
    const rooms = await db.accommodation.findAll({
      include: [{
        association: db.accommodation.associations.ratePlans,   // ← อ้างตรงๆ
        attributes: ["id", "name", "price_per_night", "accommodation_id"],
        required: false,
      }],
      order: [["id", "ASC"]],
    });

    res.json(rooms);
  } catch (err) {
    console.error("getWithRates error:", err); // ให้เห็น error จริงใน terminal
    res.status(500).json({ message: err.message, stack: err.stack });
  }
};



/* =======================================================
   GET /api/accommodation/with-rates-lite
   แบบเบา ไม่กรอง ไม่เรียงเรทราคา
======================================================= */
exports.listWithRates = async (_req, res) => {
  try {
    const rows = await Accommodation.findAll({
      attributes: ["id", "name"],
      include: [{ model: RatePlan, as: "ratePlans", required: false, attributes: ["id", "name", "price_per_night"] }],
      order: [["id", "ASC"]],
    });
    res.json(rows);
  } catch (err) {
    console.error("listWithRates error:", err);
    res.status(500).json({ message: err.message });
  }
};
