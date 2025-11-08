// app/controllers/user.controller.js
const fs = require("fs");
const path = require("path");
const db = require("../models");
const User = db.user;

// สร้าง absolute path ของโฟลเดอร์อัปโหลด
const AVATAR_DIR = path.join(__dirname, "../../uploads/avatars");

// คืนค่า path ที่จะเก็บใน DB (prefix ด้วย /uploads/avatars/...)
const toDbPath = (filename) => `/uploads/avatars/${filename}`;

/** GET /api/users/me */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ["id", "name", "lastname", "phone", "email", "avatar"],
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/** PATCH /api/users/me */
exports.updateMe = async (req, res) => {
  try {
    const { name, lastname, phone, email } = req.body || {};
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (email && email !== user.email) {
      const dup = await User.findOne({ where: { email } });
      if (dup) return res.status(409).json({ message: "Email already in use" });
      user.email = email;
    }
    if (name !== undefined) user.name = name;
    if (lastname !== undefined) user.lastname = lastname;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.json({
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/** POST /api/users/me/avatar (multipart/form-data: avatar) */
exports.uploadAvatar = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // ลบรูปเก่า (ถ้ามีและอยู่ในโฟลเดอร์ avatars)
    if (user.avatar && user.avatar.startsWith("/uploads/avatars/")) {
      const oldAbs = path.join(__dirname, "../../", user.avatar);
      fs.existsSync(oldAbs) && fs.unlinkSync(oldAbs);
    }

    user.avatar = toDbPath(req.file.filename);
    await user.save();

    res.json({ avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};
