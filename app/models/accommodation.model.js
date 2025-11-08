// app/models/accommodation.model.js
module.exports = (sequelize, DataTypes) => {
  const Accommodation = sequelize.define(
    "accommodations", // ใช้ชื่อตารางจริงของคุณ (ดูจาก tableName เดิม)
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      capacity: DataTypes.INTEGER,
      amenities: DataTypes.TEXT,
      total_rooms: { type: DataTypes.INTEGER, defaultValue: 0 },
      image_name: DataTypes.STRING,
      image_name2: DataTypes.STRING,
      image_name3: DataTypes.STRING,

      // ✅ ฟิลด์ราคา/คืน (ใช้ในโค้ดฝั่ง JS ว่า pricePerNight)
      pricePerNight: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: "price_per_night", // ← ชื่อคอลัมน์ในฐานข้อมูล
      },
    },
    {
      tableName: "accommodations",
      // ถ้ามี timestamps ในตารางให้เปิดใช้งานด้วย
      // timestamps: true,
    }
  );

  Accommodation.associate = (models) => {
    Accommodation.hasMany(models.RatePlan, { foreignKey: "accommodation_id" });
  };

  return Accommodation;
};
