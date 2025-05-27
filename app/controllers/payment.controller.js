const db = require("../models");
const Sequelize = require("sequelize");
const Booking = db.booking;
const { Op } = require("sequelize");

exports.getAllPayment = async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            order: [['id', 'ASC']],
        });

        const now = new Date();

        const results = bookings.map(booking => {
            let status = "Unknown";

            if (booking.paymentStatus === true) {
                status = "Paid";
            } else if (booking.paymentStatus === false) {
                status = "Failed";
            } else if (booking.paymentStatus === null) {
                const createdAt = new Date(booking.createdAt);
                const diffMs = now - createdAt;
                const diffHours = diffMs / (1000 * 60 * 60);

                if (diffHours <= 24) {
                    status = "Pending";
                } else {
                    status = "Overdue";
                }
            }

            return {
                id: booking.id,
                paymentStatus: booking.paymentStatus,
                createdAt: booking.createdAt,
                status: status
            };
        });

        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ message: "Error fetching payment" });
    }
};
