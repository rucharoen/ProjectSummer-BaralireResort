const db = require("../models");
const Accommodation = db.accommodation;
const Type = db.type;
const User = db.user;
const Booking = db.booking;
const Pomotion = db.pomotion;
const { Op } = require("sequelize");

exports.getAll = async (req, res) => {
    try {
        const accommodation = await Accommodation.findAll({
            include: [
                {
                    model: Type,
                    attributes: ["name"]
                }
            ],
            order: [['id', 'ASC']],
            // limit: 2
        });
        res.status(200).json(accommodation);
    } catch (error) {
        res.status(500).json({ message: "Error fetching accommodations" });
    }
}

exports.getSearch = async (req, res) => {
    try {
        const { destination, checkIn, checkOut, guests } = req.query;

        if (!checkIn || !checkOut) {
            return res.status(400).json({ message: "Please provide checkIn and checkOut dates." });
        }

        // ✅ สร้าง includeCondition แบบยืดหยุ่น
        const includeCondition = {
            model: Type,
            attributes: ["name"],
            required: true,
        };

        // ✅ ใส่ where เฉพาะเมื่อ destination ไม่ใช่ "ทั้งหมด"
        if (destination && destination !== "ทั้งหมด" && destination.toLowerCase() !== "all") {
            includeCondition.where = {
                name: { [Op.like]: `${destination}%` }
            };
        }

        const accommodations = await Accommodation.findAll({
            include: [includeCondition],
            where: {
                [Op.and]: [
                    { capacity: { [Op.gte]: parseInt(guests) } }
                ]
            }
        });

        res.status(200).json(accommodations);

    } catch (error) {
        console.error(error); // แนะนำให้ log error เพื่อ debug
        res.status(500).json({ message: "Error searching accommodations" });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            attributes: [
                'checkInDate',
                'checkOutDate',
                'adult',
                'child'
            ],
            include: [
                {
                    model: Accommodation,
                    attributes: ['name']
                },
                {
                    model: User,
                    attributes: ['name', 'lastname', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        const bookingsWithNights = bookings.map(booking => {
            const checkIn = new Date(booking.checkInDate);
            const checkOut = new Date(booking.checkOutDate);

            const oneDay = 24 * 60 * 60 * 1000;
            const nights = Math.round(Math.abs((checkOut - checkIn) / oneDay));

            return {
                ...booking.toJSON(),
                nights
            };
        });

        res.status(200).json(bookingsWithNights);
    } catch (err) {
        console.error("Error fetching bookings:", err);
        res.status(500).json({ message: "Error retrieving bookings." });
    }
};

exports.getAllPomotion = async (req, res) => {
    try {
        const pomotions = await Pomotion.findAll();
        res.status(200).json(pomotions); // ส่งข้อมูลกลับเป็น JSON
    } catch (error) {
        console.error("Error fetching promotions:", error);
        res.status(500).json({ message: "ไม่สามารถดึงข้อมูลโปรโมชั่นได้" });
    }
};

