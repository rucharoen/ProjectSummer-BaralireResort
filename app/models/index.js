const config = require('../config/db.config');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  config.DB,
  config.USER,
  config.PASSWORD,
  {
    host: config.HOST,
    dialect: config.DIALECT,
    pool: {
      max: config.pool.max,
      min: config.pool.min,
      acquire: config.pool.acquire,
      idle: config.pool.idle
    }
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user          = require("./user.model")(sequelize, Sequelize);
db.role          = require("./role.model")(sequelize, Sequelize);
db.type          = require("./type.model")(sequelize, Sequelize);
db.accommodation = require("./accommodation.model")(sequelize, Sequelize);
db.promotion     = require("./promotion")(sequelize, Sequelize);
db.activity      = require("./activity.model")(sequelize, Sequelize);
db.booking       = require("./booking.model")(sequelize, Sequelize);
db.payment       = require("./payment.model")(sequelize, Sequelize);
db.icon          = require("./icon.model")(sequelize, Sequelize);
db.receipt       = require("./receipt.model")(sequelize, Sequelize);
db.award         = require("./award.model")(sequelize, Sequelize);
db.ratePlan      = require("./ratePlan.model")(sequelize, Sequelize);
db.siteAsset     = require("./siteAsset.model")(sequelize, Sequelize); 
db.cart          = require("./cart.model")(sequelize, Sequelize);

// ... บรรทัด require โมเดลทั้งหมดยังคงเดิม ...

// ===== User / Role =====
db.user.belongsToMany(db.role, { through: "user_roles", foreignKey: "userId", otherKey: "roleId" });
db.role.belongsToMany(db.user, { through: "user_roles", foreignKey: "roleId", otherKey: "userId" });

// ===== Type / Accommodation / Promotion =====
db.type.hasMany(db.accommodation, { foreignKey: "type_id", onDelete: "CASCADE" });
db.accommodation.belongsTo(db.type, { foreignKey: "type_id" });

db.type.hasMany(db.promotion, { foreignKey: "type_id", onDelete: "CASCADE" });
db.promotion.belongsTo(db.type, { foreignKey: "type_id" });

// ===== Booking relations =====
db.user.hasMany(db.booking, { foreignKey: "userId", onDelete: "RESTRICT" });
db.booking.belongsTo(db.user, { foreignKey: "userId" });

db.accommodation.hasMany(db.booking, { foreignKey: "accommodationId", onDelete: "RESTRICT" });
db.booking.belongsTo(db.accommodation, { foreignKey: "accommodationId" });

db.booking.belongsToMany(db.type, { through: "booking_types", foreignKey: "booking_id", otherKey: "type_id" });
db.type.belongsToMany(db.booking, { through: "booking_types", foreignKey: "type_id", otherKey: "booking_id" });

db.booking.belongsToMany(db.promotion, { through: "booking_promotions", foreignKey: "booking_id", otherKey: "promotion_id" });
db.promotion.belongsToMany(db.booking, { through: "booking_promotions", foreignKey: "promotion_id", otherKey: "booking_id" });

// ===== Payment ↔ Booking =====
db.payment.hasMany(db.booking, { as: "bookings", foreignKey: "paymentId" });
db.booking.belongsTo(db.payment, { as: "payment", foreignKey: "paymentId" });

// ===== Receipt relations (เพิ่มส่วนนี้) =====
db.user.hasMany(db.receipt,    { as: "receipts",  foreignKey: "userId" });
db.receipt.belongsTo(db.user,  { as: "user",      foreignKey: "userId" });

db.payment.hasMany(db.receipt, { as: "receipts",  foreignKey: "paymentId" });
db.receipt.belongsTo(db.payment,{ as: "payment",  foreignKey: "paymentId" });

db.booking.hasMany(db.receipt, { as: "receipts",  foreignKey: "bookingId" });
db.receipt.belongsTo(db.booking,{ as: "booking",  foreignKey: "bookingId" });

// ===== RatePlan =====
db.accommodation.hasMany(db.ratePlan, { foreignKey: 'accommodation_id', as: 'ratePlans' });
db.ratePlan.belongsTo(db.accommodation, { foreignKey: 'accommodation_id', as: 'accommodation' });

module.exports = db;
