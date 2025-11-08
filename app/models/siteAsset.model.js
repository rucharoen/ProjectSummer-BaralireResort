// app/models/siteAsset.model.js
module.exports = (sequelize, Sequelize) => {
  const SiteAsset = sequelize.define(
    "site_asset",
    {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      type: { type: Sequelize.ENUM("logo", "certificate", "hero"), allowNull: false },
      url: { type: Sequelize.STRING, allowNull: false },
      title: { type: Sequelize.STRING },
      alt_text: { type: Sequelize.STRING },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
    },
    {
      tableName: "site_assets",
      timestamps: true,
      createdAt: "createdat",   // << แม็ปชื่อคอลัมน์ที่มีอยู่ใน DB
      updatedAt: "updatedat",   // << เช่นเดียวกัน
      // underscored: true, // ถ้าคุณอยากใช้ created_at/updated_at ในอนาคต ให้เปิดอันนี้แทน
    }
  );

  return SiteAsset;
};
