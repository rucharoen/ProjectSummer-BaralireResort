const controller = require("../controllers/payment.controller");

module.exports = (app) => {
  app.get("/api/payments", controller.getAllPayment);
  app.get("/api/payments/user/:userId", controller.getPaymentByUserId);

  app.post("/api/payments/:id/confirm", controller.confirmBookingPayment);
  app.post("/api/payments/:id/cancel", controller.cancelPayment);
  app.post("/api/payments/:id/fail", controller.failPayment);
};
