const db = require("../models");
const Booking = db.booking;

const User = db.user;
const Accommodation = db.accommodation;
const Promotion = db.promotion;


exports.createBooking = async (req, res) => {
    const { adult, child, checkInDate, checkOutDate } = req.query;

    try{

        const booking = await Booking.create({
            userId,
            adult,
            child,
            checkInDate,
            checkOutDate
        });
    }catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ message: "Error creating booking." });
    }
    finally {
        res.status(201).json({ message: "Booking created successfully." });
    }
}
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
          through: { attributes: [] },
        },
      ],
      order: [["paymentDate", "DESC"]],
    });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลการจองของผู้ใช้นี้" });
    }

    // สร้าง array ของใบเสร็จ
    const receipts = bookings.map((booking) => {
      const { user, accommodation, promotions } = booking;

      // คำนวณโปรโมชัน
      let discount = 0;
      if (promotions.length > 0) {
        const promo = promotions[0];
        if (promo && promo.discountPercent) {
          discount = booking.totalPrice * (promo.discountPercent / 100);
        }
      }

      // คำนวณค่าบวกเพิ่ม
      let extraCharge = 0;
      if (booking.extraBed) extraCharge += 300;
      if (booking.doubleExtraBed) extraCharge += 500;

      const finalPrice = booking.totalPrice - discount + extraCharge;

      return {
        customerName: `${user.name} ${user.lastname}`,
        email: user.email,
        phone: user.phone,
        bookingId: booking.id,
        checkIn: booking.checkInDate,
        checkOut: booking.checkOutDate,
        paymentDate: booking.paymentDate,
        adult: booking.adult,
        child: booking.child,
        totalPrice: booking.totalPrice,
        discount,
        extraCharge,
        finalPrice,
      };
    });

    res.status(200).json({ receipts });
  } catch (error) {
    console.error("Error generating receipts:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดระหว่างสร้างใบเสร็จ" });
  }
};
