// app/routes/user.routes.js
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const { authJwt } = require("../middleware");
const controller = require("../controllers/user.controller");

// เตรียมโฟลเดอร์ /uploads/avatars
const AVATAR_DIR = path.join(__dirname, "../../uploads/avatars");
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });

// ตั้งค่า multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext) ? ext : ".jpg";
    cb(null, `u${req.userId}-${Date.now()}${safeExt}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = function (app) {
  const router = require("express").Router();

  router.get("/me", [authJwt.verifyToken], controller.getMe);
  router.patch("/me", [authJwt.verifyToken], controller.updateMe);

  // ✅ อัปโหลด avatar
  router.post(
    "/me/avatar",
    [authJwt.verifyToken, upload.single("avatar")],
    controller.uploadAvatar
  );

  app.use("/api/users", router);
};
