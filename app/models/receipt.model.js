// app/models/receipt.model.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const Receipt = sequelize.define(
    "receipt",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      // FK
      userId:    { type: DataTypes.INTEGER, allowNull: false },
      paymentId: { type: DataTypes.INTEGER, allowNull: false },
      bookingId: { type: DataTypes.INTEGER, allowNull: true },

      // ฟิลด์ที่มีอยู่จริงในตาราง (จากรูปที่ส่งมา)
      customerName:        { type: DataTypes.STRING,  allowNull: false, defaultValue: "" },
      email:               { type: DataTypes.STRING,  allowNull: true  },
      phone:               { type: DataTypes.STRING,  allowNull: true  },

      accommodationName:   { type: DataTypes.STRING,  allowNull: false, defaultValue: "" },

      // *** สำคัญ: ตารางคุณบังคับ not null ที่ checkIn ***
      checkIn:             { type: DataTypes.DATE,    allowNull: false }, // NOT NULL
      checkOut:            { type: DataTypes.DATE,    allowNull: true  }, // ในตารางดูเหมือนไม่บังคับ not null

      nights:              { type: DataTypes.INTEGER,       allowNull: false, defaultValue: 0 },
      numberOfRooms:       { type: DataTypes.INTEGER,       allowNull: false, defaultValue: 0 },

      // จากตารางมีคอลัมน์ roomPricePerNight
      roomPricePerNight:   { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },

      totalPrice:          { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
      discount:            { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
      extraCharge:         { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
      finalPrice:          { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },

      // คอลัมน์นี้มีอยู่ในตาราง (camelCase)
      paymentStatus:       { type: DataTypes.STRING,        allowNull: false, defaultValue: "Pending" },

      // ในสคีมาที่โชว์ไม่มี tax/address/note/receiptDate จึงไม่ใส่ เพื่อกัน mismatch
      // timestamps (createdAt, updatedAt) ให้ Sequelize จัดการ
    },
    {
      tableName:  "receipts",
      timestamps: true,
      underscored: false,
    }
  );

  Receipt.associate = (models) => {
    const Payment = models.payment || models.Payment;
    const Booking = models.booking || models.Booking;
    const User    = models.user    || models.User;

    Receipt.belongsTo(Payment, { as: "payment", foreignKey: "paymentId" });
    Receipt.belongsTo(Booking, { as: "booking", foreignKey: "bookingId" });
    Receipt.belongsTo(User,    { as: "user",    foreignKey: "userId" });
  };

  return Receipt;
};
