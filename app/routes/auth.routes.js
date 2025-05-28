const controller = require("../controllers/auth.contrroller");

module.exports = (app) => {
    app.post("/api/auth/signin", controller.signin);
    app.post("/api/hash", controller.hashPassword);
};
