const controller = require("../controllers/booking.controller");

module.exports = (app) => {
    app.post("/api/booking", controller.createBooking);
    app.get("/api/receipt/:id", controller.receipt);
}
