const db = require("../models");
const Booking = db.booking;
const Payment = db.payment;
const User = db.user;
const Accommodation = db.accommodation;
const Promotion = db.promotion;
const Receipt = db.receipt;


// ใช้ req.body เพราะเป็น POST request
exports.createMultiBooking = async (req, res) => {
  const { userId, bookings, paymentMethod } = req.body;

  if (!userId || !bookings || !Array.isArray(bookings) || bookings.length === 0 || !paymentMethod) {
    return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  try {
    let totalAmount = 0;
    const bookingDataList = [];

    for (const item of bookings) {
      const {
        accommodationId,
        numberOfRooms,
        adult,
        child,
        checkInDate,
        checkOutDate,
        pricePerNight
      } = item;

      if (!accommodationId || !checkInDate || !checkOutDate || !pricePerNight || !numberOfRooms) {
        return res.status(400).json({ message: "ข้อมูลการจองไม่ครบถ้วน" });
      }

      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const totalNights = Math.ceil((checkOut - checkIn) / (1000 * 3600 * 24));
      const totalPricePerBooking = totalNights * pricePerNight * numberOfRooms;

      totalAmount += totalPricePerBooking;

      // เก็บข้อมูลไว้ก่อน
      bookingDataList.push({
        userId,
        accommodationId,
        numberOfRooms,
        adult,
        child,
        checkInDate,
        checkOutDate,
        paymentMethod,
        totalNights,
        totalPrice: totalPricePerBooking,
        bookingStatus: "Pending",
        due_Date: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    }

    // สร้าง Payment รายการเดียว
    const payment = await Payment.create({
      user_id:userId,
      method: paymentMethod,
      amount: totalAmount,
      status: "Pending",
      due_Date: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // สร้าง Booking ทั้งหมด และเชื่อมกับ paymentId
    const bookingsCreated = await Promise.all(
      bookingDataList.map(b => Booking.create({ ...b, paymentId: payment.id }))
    );

    res.status(201).json({
      message: "สร้างการจองสำเร็จ",
      payment,
      bookings: bookingsCreated
    });

  } catch (error) {
    console.error("Error creating multiple bookings:", error);
    res.status(500).json({ message: "ไม่สามารถสร้างการจองได้" });
  }
};



// exports.getAllBookings = async (req, res) => {
//     try {
//         const bookings = await Booking.findAll({
//             include: [
//                 {
//                     model: Accommodation,
//                     attributes: ['name'] // ดึงชื่อห้องพัก
//                 }
//             ],
//             order: [['createdAt', 'DESC']] // เรียงจากวันที่จองล่าสุด
//         });

//         const result = bookings.map(b => ({
//             guestName: b.name,
//             email: b.email,
//             phone: b.phone,
//             checkInDate: b.checkInDate,
//             checkOutDate: b.checkOutDate,
//             bookingDate: b.createdAt,
//             status: b.status,
//             accommodationName: b.accommodation ? b.accommodation.name : null
//         }));

//         res.status(200).json(result);

//     } catch (error) {
//         console.error("Error fetching bookings:", error);
//         res.status(500).json({ message: "Error fetching booking information." });
//     }
// };



exports.receipt = async (req, res) => {
  const userId = req.params.id;

  try {
    const bookings = await Booking.findAll({
      where: { userId },
      include: [
        { model: User, attributes: ["name", "lastname", "email", "phone"] },
        { model: Accommodation, attributes: ["name", "price_per_night"] },
        {
          model: db.promotion,
          attributes: ["percent"],
          through: { attributes: [] },
        },
        {
          model: db.type,
          attributes: ["name"],
        },
      ],
      order: [["paymentDate", "DESC"]],
    });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลการจองของผู้ใช้นี้" });
    }

    // ✅ ดึง bookingId ที่มีใบเสร็จอยู่แล้ว
    const existingReceipts = await Receipt.findAll({
      where: { bookingId: bookings.map((b) => b.id) },
      attributes: ["bookingId"],
    });

    const existingBookingIds = new Set(existingReceipts.map((r) => r.bookingId));

    const receiptsToCreate = [];

    for (const booking of bookings) {
      if (existingBookingIds.has(booking.id)) {
        continue; // ข้ามถ้ามีใบเสร็จแล้ว
      }

      const { user, accommodation, promotions } = booking;
      const {
        adult,
        child,
        extraBed,
        doubleExtraBed,
        numberOfRooms,
        checkInDate,
        checkOutDate,
      } = booking;

      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const baseRoomPrice = accommodation.price_per_night;
      const totalPrice = baseRoomPrice * nights * numberOfRooms;

      let discount = 0;
      if (promotions.length > 0) {
        const promo = promotions[0];
        if (promo?.percent) {
          const discountPercent = parseFloat(promo.percent);
          if (!isNaN(discountPercent)) {
            discount = totalPrice * (discountPercent / 100);
          }
        }
      }

      let extraCharge = 0;
      let extraPersonCharge = 0;

      if (adult === 1 && child === 3) {
        extraPersonCharge += 749;
      } else if (adult === 2 && child === 1) {
        extraPersonCharge += 749;
      } else if (adult === 3) {
        extraPersonCharge += 1000;
        if (child === 1) {
          extraPersonCharge += 749;
        }
      }

      if (extraBed) extraCharge += 200;
      if (doubleExtraBed) extraCharge += 500;

      extraCharge += extraPersonCharge;

      const finalPrice = totalPrice - discount + extraCharge;

      receiptsToCreate.push({
        userId: userId,
        customerName: `${user.name} ${user.lastname}`,
        email: user.email,
        phone: user.phone,
        bookingId: booking.id,
        checkIn,
        checkOut,
        accommodationName: accommodation.name,
        nights,
        numberOfRooms,
        roomPricePerNight: baseRoomPrice,
        totalPrice,
        discount,
        extraCharge,
        finalPrice,
      });
    }

    if (receiptsToCreate.length > 0) {
      await Receipt.bulkCreate(receiptsToCreate);
    }

    res.status(200).json({
      message: receiptsToCreate.length > 0
        ? "สร้างใบเสร็จใหม่สำเร็จ"
        : "ไม่มีใบเสร็จใหม่ที่ต้องสร้าง (มีอยู่แล้วทั้งหมด)",
      created: receiptsToCreate.length,
      receipts: receiptsToCreate,
    });
  } catch (error) {
    console.error("Error generating receipts:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดระหว่างสร้างใบเสร็จ" });
  }
};