const { parse } = require("dotenv");

require("dotenv/config");

module.exports = {
    HOST: process.env.DB_HOST,
    PORT: process.env.DB_PORT || 5432,
    USER: process.env.DB_USER,
    PASSWORD: process.env.DB_PASSWORD,
    DB: process.env.DB_NAME,
    DIALECT: process.env.DB_DIALECT || "postgres",
    pool: {
        max:parseInt(process.env.DB_POOL_MAX), 
        min:parseInt(process.env.DB_POOL_MIN),
        acquire:parseInt(process.env.DB_POOL_ACQUIRE),
        idle:parseInt(process.env.DB_POOL_IDLE),
    }
}