const db = require("../models");
const Sequelize = require("sequelize");

const Accommodation = db.accommodation;
const Type = db.type;
const User = db.user;
const Booking = db.booking;
const Promotion = db.promotion;
const { Op } = require("sequelize");
const Payment = db.payment;

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

    const accommodations = await Accommodation.findAll({
      include: [includeCondition],
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      where: guests ? {
        capacity: { [Op.gte]: parseInt(guests) }
      } : undefined
    });

    const bookings = await Booking.findAll({
      where: {
        [Op.or]: [
          { bookingStatus: 'Paid' },
          {
            bookingStatus: 'Pending',
            due_Date: { [Op.gte]: new Date() }
          }
        ],
        [Op.and]: [
          { checkInDate: { [Op.lte]: parsedCheckOut } },
          { checkOutDate: { [Op.gte]: parsedCheckIn } }
        ]
      }
    });

    const bookingCount = {};
    bookings.forEach(b => {
      const accId = b.accommodationId;
      const roomsBooked = b.numberOfRooms || 1;
      bookingCount[accId] = (bookingCount[accId] || 0) + roomsBooked;
    });

    const results = accommodations.map(acc => {
      const bookedRooms = bookingCount[acc.id] || 0;
      const availableRooms = acc.total_rooms - bookedRooms;
      return {
        ...acc.toJSON(),
        availableRooms: availableRooms > 0 ? availableRooms : 0
      };
    });

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
        'totalPrice',
        'extraBed',
        'doubleExtraBed',
        'numberOfRooms'
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
      const numberOfRooms = booking.numberOfRooms || 1;

      const roomPriceTotal = basePrice * nights * numberOfRooms;
      const discountedRoomPrice = roomPriceTotal * (1 - percent / 100);

      let extraPersonCharge = 0;
      let extraBedCharge = 0;
      let doubleExtraBedCharge = 0;

      if (adult === 1) {
        if (child > 3) {
          return {
            ...booking.toJSON(),
            error: "ไม่สามารถมีเด็กมากกว่า 3 คนได้ถ้ามีผู้ใหญ่เพียง 1 คน"
          };
        } else if (child === 3) {
          extraPersonCharge += 749;
        }
      } else if (adult === 2) {
        if (child > 1) {
          return {
            ...booking.toJSON(),
            error: "ไม่สามารถมีเด็กมากกว่า 1 คนได้ถ้ามีผู้ใหญ่ 2 คน"
          };
        } else if (child === 1) {
          extraPersonCharge += 749;
        }
      } else if (adult === 3) {
        if (child > 1) {
          return {
            ...booking.toJSON(),
            error: "ไม่สามารถมีเด็กมากกว่า 1 คนได้ถ้ามีผู้ใหญ่ 3 คน"
          };
        } else {
          extraPersonCharge += 1000;
          if (child === 1) {
            extraPersonCharge += 749;
          }
        }
      } else if (adult > 3) {
        return {
          ...booking.toJSON(),
          error: "ไม่สามารถมีผู้ใหญ่เกิน 3 คนต่อห้องได้"
        };
      }

      if (booking.extraBed) {
        extraBedCharge = 200;
      }
      if (booking.doubleExtraBed) {
        doubleExtraBedCharge = 500;
      }

      const extraCharge = extraPersonCharge + extraBedCharge + doubleExtraBedCharge;
      const finalPrice = discountedRoomPrice + extraCharge;

      return {
        ...booking.toJSON(),
        roomPriceTotal: roomPriceTotal.toFixed(2),
        discountedRoomPrice: discountedRoomPrice.toFixed(2),
        extraCharge,
        extraDetails: {
          extraPersonCharge,
          extraBedCharge,
          doubleExtraBedCharge
        },
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
  const { checkIn, checkOut } = req.query;
  const parsedCheckIn = new Date(checkIn);
  const parsedCheckOut = new Date(checkOut);
  const now = new Date();

  try {
    const accommodations = await Accommodation.findAll();

    const bookings = await Booking.findAll({
      include: [
        {
          model: Payment,
          as: 'payment',
          where: {
            [Op.or]: [
              { paymentStatus: 'Paid' },
              {
                paymentStatus: 'Pending',
                due_Date: { [Op.gte]: now }
              }
            ]
          },
          required: true
        }
      ],
      where: {
        [Op.and]: [
          { checkInDate: { [Op.lte]: parsedCheckOut } },
          { checkOutDate: { [Op.gte]: parsedCheckIn } }
        ]
      }
    });

    const bookedCountByAccommodation = {};
    bookings.forEach(booking => {
      const accommodationId = booking.accommodationId;
      const amount = booking.numberOfRooms || 1;
      bookedCountByAccommodation[accommodationId] = (bookedCountByAccommodation[accommodationId] || 0) + amount;
    });

    const availability = accommodations.map(acc => {
      const bookedRooms = bookedCountByAccommodation[acc.id] || 0;
      const totalRooms = acc.total_rooms || 0;
      const availableRooms = totalRooms - bookedRooms;

      return {
        accommodationName: acc.name,
        total_rooms: totalRooms,
        bookedRooms,
        availableRooms: availableRooms >= 0 ? availableRooms : 0
      };
    });

    res.status(200).json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error("Error in getAvailability:", error);
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