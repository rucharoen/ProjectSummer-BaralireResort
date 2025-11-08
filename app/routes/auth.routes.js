// app/routes/auth.routes.js
const controller = require("../controllers/auth.controller");

module.exports = (app) => {
  app.post("/api/auth/signin", controller.signin);
  app.post("/api/auth/logout", controller.logout);   // ถ้าต้องการ
  app.get("/api/auth/me", controller.me);            // ถ้าต้องการ
  app.post("/api/hash", controller.hashPassword);    // ยูทิลิตี้
};
