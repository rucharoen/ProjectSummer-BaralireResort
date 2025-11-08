// models/RoomRate.js
module.exports = (sequelize, DataTypes) => {
  const RoomRate = sequelize.define(
    "RoomRate",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      rate_plan_id: { type: DataTypes.INTEGER, allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      allotment: { type: DataTypes.INTEGER, defaultValue: null }, // จำนวนห้องโควต้า/วัน (ถ้าใช้)
      closed: { type: DataTypes.BOOLEAN, defaultValue: false }, // ปิดขายวันนั้น
    },
    {
      tableName: "room_rates",
      indexes: [{ unique: true, fields: ["rate_plan_id", "date"] }],
    }
  );

  RoomRate.associate = (models) => {
    RoomRate.belongsTo(models.RatePlan, { foreignKey: "rate_plan_id" });
  };
  return RoomRate;
};
