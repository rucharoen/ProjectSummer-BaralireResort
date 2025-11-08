// app/routes/cart.routes.js
module.exports = (app) => {
  const router = require("express").Router();
  const cart = require("../controllers/cart.controller");
  // middleware รวมของคุณอยู่ที่นี่
  // ดูจากโครง: app/middleware/index.js น่าจะ export { authJwt }
  const { authJwt } = require("../middleware");

  // ต้องล็อกอินเท่านั้น
  router.use(authJwt.verifyToken);

  router.get("/", cart.getCart);
  router.put("/", cart.putCart);
  router.delete("/", cart.clearCart);

  app.use("/api/cart", router);
};
