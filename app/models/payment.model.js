module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define("payments", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    userId: { type: DataTypes.INTEGER, allowNull: true, field: "user_id" },

    method: { type: DataTypes.STRING, allowNull: true },
    amount: { type: DataTypes.DECIMAL(10,2), allowNull: true },

    paymentStatus: {
      type: DataTypes.ENUM("Pending","Paid","Failed","Overdue","Cancelled"),
      allowNull: false,
      defaultValue: "Pending",
    },

    // ✅ ใช้ attribute ชื่อ dueDate ในโค้ด แต่ map ไปคอลัมน์เดิม due_Date
    dueDate:   { type: DataTypes.DATE, allowNull: true, field: "due_Date" },

    // จะมี/ไม่มีก็ได้ ถ้ามีก็ map ให้ชัดเจน
    paidAt:    { type: DataTypes.DATE, allowNull: true, field: "paid_at" },
  }, {
    tableName: "payments",
    // timestamps: true,
  });

  return Payment;
};
