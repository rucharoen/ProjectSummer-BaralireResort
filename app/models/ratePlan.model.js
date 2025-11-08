// models/RatePlan.js
module.exports = (sequelize, DataTypes) => {
  const RatePlan = sequelize.define(
    "RatePlan",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      accommodation_id: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false }, // เช่น "ยกเลิกได้", "ไม่คืนเงิน + BF"
      code: DataTypes.STRING, // optional, ใช้แมปภายใน
      description: DataTypes.TEXT,

      // เงื่อนไขราคา
      is_refundable: { type: DataTypes.BOOLEAN, defaultValue: true },
      cancellation_policy: DataTypes.TEXT,
      meal_plan: { type: DataTypes.STRING }, // "RO","BB","HB" ฯลฯ
      pay_type: {
        type: DataTypes.ENUM("prepaid", "pay_at_hotel"),
        defaultValue: "prepaid",
      },

      // ราคา base ของแผนนี้ (ถ้าไม่มีปฏิทินรายวัน)
      price_per_night: { type: DataTypes.DECIMAL(10, 2), allowNull: false },

      // ส่วนลดเฉพาะแผน (ซ้อนกับโปรได้)
      discount_percent: { type: DataTypes.INTEGER, defaultValue: 0 },

      currency: { type: DataTypes.STRING, defaultValue: "THB" },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { tableName: "rate_plans" }
  );

  RatePlan.associate = (models) => {
    RatePlan.belongsTo(models.Accommodation, {
      foreignKey: "accommodation_id",
    });
    RatePlan.hasMany(models.RoomRate, { foreignKey: "rate_plan_id" });
  };
  return RatePlan;
};
