// app/models/cart.model.js
module.exports = (sequelize, DataTypes) => {
  const Cart = sequelize.define("cart", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // รถเข็น 1 ชุดต่อ 1 ผู้ใช้
    },
    items: {
      // ใช้ JSON ได้กับ MySQL 5.7+/MariaDB 10.2+ / Postgres (JSONB ก็ได้)
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
  });

  // ถ้ามีตาราง user อยู่แล้ว ขี้นกับว่าคุณอยากผูก FK ไหม
  Cart.associate = (models) => {
    if (models.user) {
      Cart.belongsTo(models.user, { foreignKey: "userId" });
    }
  };

  return Cart;
};
