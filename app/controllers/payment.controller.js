const db = require("../models");
const Sequelize = require("sequelize");
const Booking = db.booking;
const { Op } = require("sequelize");

exports.getAllPayment = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      order: [['id', 'ASC']],
    });

    const results = bookings.map(booking => ({
      id: booking.id,
      bookingStatus: booking.bookingStatus,
      createdAt: booking.createdAt,
    }));

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Error fetching payment" });
  }
};

exports.confirmBookingPayment = async (req, res) => {
    const id = req.params.id;
    if (!id) {
        return res.status(400).json({ message: "กรุณาระบุ ID การจอง" });
    }

    try {
        const booking = await Booking.findByPk(id);
        if (!booking) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการจอง" });
        }

        if (booking.bookingStatus === 'Paid') {
            return res.status(400).json({ message: "รายการนี้ชำระเงินไปแล้ว" });
        }

        booking.bookingStatus = 'Paid';
        booking.paymentDate = new Date();
        booking.due_Date = new Date();
        await booking.save();

        res.status(200).json({ message: "ยืนยันการชำระเงินสำเร็จ", booking });

    } catch (error) {
        console.error("Error confirming payment:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดระหว่างการยืนยันการชำระเงิน" });
    }
};




// exports.updateOverdueBookings = async (req, res) => {
//   try {
//     const now = new Date();

//     // ดึง bookings ที่ยังเป็น Pending เกิน 24 ชม.
//     const overdueBookings = await Booking.findAll({
//       where: {
//         bookingStatus: 'Pending',
//         createdAt: {
//           [Op.lte]: new Date(now.getTime() - 24 * 60 * 60 * 1000) // เกิน 24 ชม.
//         }
//       }
//     });

//     // อัปเดต bookingStatus = 'Overdue'
//     for (const booking of overdueBookings) {
//       booking.bookingStatus = 'Overdue';
//       await booking.save();
//     }

//     res.status(200).json({
//       message: `${overdueBookings.length} bookings have been marked as Overdue.`,
//       updated: overdueBookings.map(b => ({
//         id: b.id,
//         createdAt: b.createdAt,
//         updatedStatus: "Overdue"
//       }))
//     });
//   } catch (error) {
//     console.error("Error updating overdue bookings:", error);
//     res.status(500).json({ message: "Error updating overdue bookings" });
//   }
// };
