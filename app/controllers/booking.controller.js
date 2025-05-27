const db = require("../models");
const Booking = db.booking;
// const Accommodation = db.accommodation;


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
