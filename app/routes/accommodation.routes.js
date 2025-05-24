// const { authJwt } = require("../middleware");
const controller = require("../controllers/accommodation.controller");


const authJwt = require("../middleware/authJwt");
module.exports = (app) => {
    // [authJwt.verifyToken]
    app.get("/api/accommodation/search", controller.getSearch);
    app.get("/api/accommodation",controller.getAll);
    app.get("/api/accommodation/booking",controller.getAllBookings);
    app.get("/api/accommodation/promotion",controller.getAllPromotion);
    app.get("/api/accommodation/availableroom",controller.getAvailability);
    app.get("/api/accommodation/:id/rating", controller.getAccommodationRating);
    
}     