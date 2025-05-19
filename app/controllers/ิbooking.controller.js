// const db = require("../models");
// const Booking = db.booking;
// const Accommodation = db.accommodation;

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
