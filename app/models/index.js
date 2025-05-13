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
db.pomotion = require("../models/pomotion")(sequelize, Sequelize);

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

// One-to-many
db.type.hasMany(db.pomotion,{
    foreignKey: "type_id",
    onDelete: "CASCADE"
});
db.accommodation.belongsTo(db.type,{
     foreignKey: "type_id"
});

module.exports = db;