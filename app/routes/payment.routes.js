const controller = require("../controllers/payment.controller");

module.exports = (app) => {
    app.get("/api/payment", controller.getAllPayment);
}
