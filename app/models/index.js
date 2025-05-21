const config = require('../config/db.config');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    config.DB, 
    config.USER, 
    config.PASSWORD, 
    {
        host:config.HOST,
        dialect:config.DIALECT, 
        pool:{
            max:config.pool.max,
            min:config.pool.min,
            acquire:config.pool.acquire,
            idle:config.pool.idle
        }
    }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize; 

db.user = require("../models/user.model")(sequelize, Sequelize);
db.role = require("../models/role.model")(sequelize, Sequelize);
//db.user_roles = require("../models/user.roles.models")(sequelize, Sequelize);
db.type = require("../models/type.model")(sequelize, Sequelize);
db.accommodation = require("../models/accommodation.model")(sequelize, Sequelize);
db.promotion = require("../models/promotion")(sequelize, Sequelize);
db.activity = require("../models/activity.model")(sequelize, Sequelize);
db.booking = require("../models/booking.model")(sequelize, Sequelize);

// many-to-many
db.role.belongsToMany(db.user,{
    through: "user_roles"
});
db.user.belongsToMany(db.role,{
    through: "user_roles"
});
// One-to-many
db.type.hasMany(db.accommodation,{
    foreignKey: "type_id",
    onDelete: "CASCADE"
});
db.accommodation.belongsTo(db.type,{
     foreignKey: "type_id"
});

// One-to-many  ตารางโปโมชั่น กับ ไทด์
db.type.hasMany(db.promotion,{
    foreignKey: "type_id",
    onDelete: "CASCADE"
});
db.promotion.belongsTo(db.type, {
    foreignKey: "type_id"
});


// One-to-Many
db.user.hasMany(db.booking, {
    foreignKey: "userId",
    onDelete: "RESTRICT"
});

db.booking.belongsTo(db.user, {
    foreignKey: "userId"
});

// One-to-Many: accommodation → booking
db.accommodation.hasMany(db.booking, {
    foreignKey: "accommodationId",
    onDelete: "RESTRICT"
});

// ❗ ฝั่งกลับ booking → accommodation
db.booking.belongsTo(db.accommodation, {
    foreignKey: "accommodationId"
});

// One-to-Many: accommodation → booking
db.accommodation.hasMany(db.booking, {
    foreignKey: "accommodationId",
    onDelete: "RESTRICT"
});

// ฝั่งกลับ: booking → belongsTo accommodation
db.booking.belongsTo(db.accommodation, {
    foreignKey: "accommodationId"
});


module.exports = db;