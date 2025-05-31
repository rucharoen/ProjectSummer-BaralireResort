module.exports = (sequelize, Sequelize) => {
  const Receipt = sequelize.define("receipt", {
    customerName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    bookingId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    checkIn: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    checkOut: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    accommodationName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    nights: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    numberOfRooms: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    roomPricePerNight: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    },
    totalPrice: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    },
    discount: {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    extraCharge: {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    finalPrice: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    },
    userId: {
  type: Sequelize.INTEGER,
  allowNull: false,
  references: {
    model: "users", // ชื่อตารางในฐานข้อมูล (ต้องตรง)
    key: "id"
  }
}
  });

  return Receipt;
};
