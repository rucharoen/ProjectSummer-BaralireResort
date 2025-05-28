const controller = require("../controllers/payment.controller");

module.exports = (app) => {
    app.get("/api/payment", controller.getAllPayment);
    // app.get("/api/payment/update-overdue", controller.updateOverdueBookings);
    app.put("/api/bookings/payment/:id", controller.confirmBookingPayment);
}
