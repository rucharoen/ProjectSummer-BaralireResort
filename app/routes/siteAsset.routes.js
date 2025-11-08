// app/routes/siteAsset.routes.js
module.exports = (app) => {
  const controller = require("../controllers/siteAsset.controller");
  const router = require("express").Router();
  const auth = require("../middleware/authJwt"); // ถ้ามี middleware ยืนยันตัวตน

  // CRUD
  router.post("/", /* [auth.verifyToken, auth.isAdmin], */ controller.create);
  router.get("/", controller.findAll);
  router.get("/latest/:type", controller.findLatestByType); // /api/site-assets/latest/logo
  router.put("/:id", /* [auth.verifyToken, auth.isAdmin], */ controller.update);
  router.delete("/:id", /* [auth.verifyToken, auth.isAdmin], */ controller.delete);

  app.use("/api/site-assets", router);
};
