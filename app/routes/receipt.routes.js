module.exports = app => {
  const receipt = require("../controllers/receipt.controller.js");
  const router = require("express").Router();

  router.get("/:userId", receipt.findByUser);   // ✅ ต้องมีแบบนี้
  router.post("/generate", receipt.generate);  // ✅ ถ้ามีฟังก์ชันสร้างใบเสร็จ

  app.use("/api/receipt", router);
};
