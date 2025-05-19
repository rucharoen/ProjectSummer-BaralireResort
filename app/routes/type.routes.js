const { authJwt } = require("../middleware");
const controller = require("../controllers/type.controller");

module.exports = (app) => {
    // [authJwt.verifyToken]
    app.get("/api/accommodation/type", controller.getAll);
}