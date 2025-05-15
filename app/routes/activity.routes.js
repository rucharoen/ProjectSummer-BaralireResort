// const { authJwt } = require("../middleware");
const controller = require("../controllers/activity.controller");

module.exports = (app) => {
    // [authJwt.verifyToken]
    app.get("/api/activity", controller.getAll);
}