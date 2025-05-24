module.exports = (sequelize, DataTypes) => {
  const TypePromo = sequelize.define("type_promo", {
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    promotionId: {
      type: DataTypes.INTEGER,
      allowNull: true, // ✅ อนุญาตให้เป็น null
    },
  });

  return TypePromo;
};