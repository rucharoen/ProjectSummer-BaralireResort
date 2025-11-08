// app/models/booking.model.js
module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define(
    "bookings",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      numberOfRooms: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      adult: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      child: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      accommodationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      totalNights: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      checkInDate: {
        type: DataTypes.DATE,      // ถ้าต้องการไม่เก็บเวลา ใช้ DATEONLY ก็ได้
        allowNull: false,
      },

      checkOutDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      totalPrice: {
        // ถ้าต้องการความแม่นยำ ใช้ DECIMAL(10,2)
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      doubleExtraBed: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
      },

      extraBed: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
      },

      bookingStatus: {
        type: DataTypes.ENUM("Pending", "Confirmed", "Overdue", "Cancelled"),
        defaultValue: "Pending",
        allowNull: false,
      },

      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      paymentDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "payment_date",
      },

      specialRequests: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      checkedIn: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      checkedOut: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      isCancelled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      checkInNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      checkOutNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      checkOutRating: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      checkInTimestamp: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      checkOutTimestamp: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // ถ้าต้องการเก็บ due บน Booking (ไม่จำเป็นถ้าเก็บที่ Payment แล้ว)
      // แนะนำตั้งชื่อ attribute เป็น camelCase แล้ว map field ไป snake_case
      dueDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "due_date",
      },

      paymentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "payment_id",
      },
    },
    {
      tableName: "bookings",
      // timestamps: true, // เปิดถ้าตารางมี createdAt/updatedAt
    }
  );

  return Booking;
};
