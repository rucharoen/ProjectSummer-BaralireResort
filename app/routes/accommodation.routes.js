// const { authJwt } = require("../middleware");
const controller = require("../controllers/accommodation.controller");


const authJwt = require("../middleware/authJwt");
module.exports = (app) => {
    // [authJwt.verifyToken]
    app.get("/api/accommodation/search", controller.getSearch);
    app.get("/api/accommodation",controller.getAll);
    app.get("/api/booking",controller.getAllBookings);
    app.get("/api/pomotion",controller.getAllPomotion);
}     