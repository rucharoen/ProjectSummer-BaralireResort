const db = require("../models");
const Sequelize = require("sequelize");

const Accommodation = db.accommodation;
const Type = db.type;
const User = db.user;
const Booking = db.booking;
const Promotion = db.promotion;
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
    const { destination, guests, checkIn, checkOut, onlyAvailable } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({ message: "Please provide checkIn and checkOut dates." });
    }

    const parsedCheckIn = new Date(checkIn);
    const parsedCheckOut = new Date(checkOut);

    // 1. Include condition for Type
    const includeCondition = {
      model: Type,
      attributes: ["id", "name"],
      required: true
    };

    if (destination && destination !== "ทั้งหมด" && destination.toLowerCase() !== "all") {
      includeCondition.where = {
        name: { [Op.like]: `${destination}%` }
      };
    }

    // 2. ดึง accommodation ทั้งหมดที่รองรับ guests
    const accommodations = await Accommodation.findAll({
      include: [includeCondition],
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      where: guests ? {
        capacity: { [Op.gte]: parseInt(guests) }
      } : undefined
    });

    // 3. ดึง bookings ที่ยัง active อยู่ในช่วงเวลานั้น และ paymentStatus == true
    const bookings = await Booking.findAll({
      where: {
        paymentStatus: true,
        [Op.and]: [
          { checkInDate: { [Op.lte]: parsedCheckOut } },
          { checkOutDate: { [Op.gte]: parsedCheckIn } }
        ]
      }
    });

    // 4. นับจำนวน booking ต่อ accommodationId
    const bookingCount = {};
    bookings.forEach(b => {
      const accId = b.accommodationId;
      bookingCount[accId] = (bookingCount[accId] || 0) + 1;
    });

    // 5. ใส่ availableRooms ลงในผลลัพธ์
    const results = accommodations.map(acc => {
      const bookedRooms = bookingCount[acc.id] || 0;
      const availableRooms = acc.total_rooms - bookedRooms;
      return {
        ...acc.toJSON(),
        availableRooms: availableRooms > 0 ? availableRooms : 0
      };
    });

    // 6. กรองเฉพาะที่มีห้องว่างถ้าผู้ใช้กำหนด
    let finalResults = results;
    if (onlyAvailable === 'true') {
      finalResults = results.filter(acc => acc.availableRooms > 0);
    }

    res.status(200).json(finalResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error searching accommodations" });
  }
};





exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            attributes: [
                'adult',
                'child',
                'checkInDate',
                'checkOutDate',
                'totalNights',
                'totalPrice'
            ],
            include: [
                {
                    model: Accommodation,
                    attributes: ['name']
                },
                {
                    model: User,
                    attributes: ['name', 'lastname', 'email']
                },
                {
                    model: Promotion,
                    attributes: ['percent'],
                    through: { attributes: [] }
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        const bookingsWithUpdatedPrice = bookings.map(booking => {
            const adult = booking.adult;
            const child = booking.child;
            const nights = booking.totalNights;
            const basePrice = booking.totalPrice;
            const promotion = booking.promotions?.[0];
            const percent = promotion?.percent || 0;

            // ราคาห้องรวมตามจำนวนคืน
            const roomPriceTotal = basePrice * nights;

            // หักส่วนลดเฉพาะค่าห้อง
            const discountedRoomPrice = roomPriceTotal * (1 - percent / 100);

            // คิดราคาคนเพิ่ม extracharge
            let extraCharge = 0;
            if (adult === 1) {
                if (child > 2) {
                    extraCharge += (child - 2) * 749;
                }
            } else if (adult === 2) {
                if (child > 0) {
                    extraCharge += child * 749;
                }
            } else if (adult > 2) {
                extraCharge += (adult - 2) * 1000;
                extraCharge += child * 749;
            }

            //  ราคารวมหลังลด
            const finalPrice = discountedRoomPrice + extraCharge;

            return {
                ...booking.toJSON(),
                roomPriceTotal: roomPriceTotal.toFixed(2),
                discountedRoomPrice: discountedRoomPrice.toFixed(2),
                extraCharge: extraCharge,
                discountPercent: percent,
                finalPrice: finalPrice.toFixed(2)
            };
        });

        res.status(200).json(bookingsWithUpdatedPrice);
    } catch (err) {
        console.error("Error fetching bookings:", err);
        res.status(500).json({ message: "Error retrieving bookings." });
    }
};


exports.getAllPromotion = async (req, res) => {
    try {
        const promotions = await db.promotion.findAll({
            attributes: [
                'id',
                'condition',
                'percent',
                'period',
                'description'
            ],
            include: [
                {
                    model: Type,
                    attributes: [
                        
                        'name',
                        'details'
                    ]
                },
            ]
        });

    //     const bookedCountByAccommodation = {};
    //   promotions.forEach(booking => {
    //   const accommodationId = booking.accommodationId;
    //   const amount = 1; // สมมุติ 1 booking = 1 ห้อง ถ้ามีฟิลด์จำนวนใน booking ให้แก้ตรงนี้

    //   if (!bookedCountByAccommodation[accommodationId]) {
    //     bookedCountByAccommodation[accommodationId] = 0;
    //   }

    //   bookedCountByAccommodation[accommodationId] += amount;
    // });

    // // สร้างข้อมูล availability โดยเพิ่ม bookedRooms และ availableRooms
    // const availability = promotions.map(acc => {
    //   const bookedRooms = bookedCountByAccommodation[acc.id] || 0;
    //   const totalRooms = acc.total_rooms || 0;
    //   const availableRooms = totalRooms - bookedRooms;
    // });
        res.status(200).json(promotions); // ส่งข้อมูลกลับเป็น JSON
    } catch (error) {
        console.error("Error fetching promotions:", error);
        res.status(500).json({ message: "ไม่สามารถดึงข้อมูลโปรโมชั่นได้" });
    }
};


exports.getAvailability = async (req, res) => {
  try {
    // ดึงข้อมูลห้องพักทั้งหมด
    const accommodations = await Accommodation.findAll();

    // ดึงข้อมูล Booking ที่ชำระเงินแล้ว
    const bookings = await Booking.findAll({
      where: {
        paymentStatus: true
      }
    });

    // นับจำนวนห้องที่ถูกจอง สำหรับแต่ละ accommodationId
    const bookedCountByAccommodation = {};

    bookings.forEach(booking => {
      const accommodationId = booking.accommodationId;
      const amount = 1; // สมมุติ 1 booking = 1 ห้อง ถ้ามีฟิลด์จำนวนใน booking ให้แก้ตรงนี้

      if (!bookedCountByAccommodation[accommodationId]) {
        bookedCountByAccommodation[accommodationId] = 0;
      }

      bookedCountByAccommodation[accommodationId] += amount;
    });

    // สร้างข้อมูล availability โดยเพิ่ม bookedRooms และ availableRooms
    const availability = accommodations.map(acc => {
      const bookedRooms = bookedCountByAccommodation[acc.id] || 0;
      const totalRooms = acc.total_rooms || 0;
      const availableRooms = totalRooms - bookedRooms;

      return {
        accommodationName: acc.name,
        total_rooms: totalRooms,
        bookedRooms: bookedRooms,
        availableRooms: availableRooms >= 0 ? availableRooms : 0 // กันกรณีติดลบ
      };
    });

    res.status(200).json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

exports.getAccommodationRating = async (req, res) => {
  const accommodationId = req.params.id;

  try {
    const result = await Booking.findOne({
      attributes: [
        [Sequelize.fn("AVG", Sequelize.col("checkOutRating")), "avgRating"],
        [Sequelize.fn("COUNT", Sequelize.col("checkOutRating")), "totalReviews"],
      ],
      where: {
        accommodationId,
        checkOutRating: {
          [Sequelize.Op.not]: null,
        }
      }
    });

    const avgRating = parseFloat(result.dataValues.avgRating).toFixed(1);
    const totalReviews = parseInt(result.dataValues.totalReviews);

    res.json({ avgRating, totalReviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงคะแนน" });
  }
}