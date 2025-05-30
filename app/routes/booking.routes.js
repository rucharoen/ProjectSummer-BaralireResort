const controller = require("../controllers/booking.controller");

module.exports = (app) => {
    app.post("/api/booking", controller.createMultiBooking);
    app.get("/api/receipt/:id", controller.receipt);
}
