// app/controllers/auth.controller.js
const db = require("../models");
const User = db.user;                 // ต้องมี model user ใน Sequelize
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv/config");

// helper: สร้าง payload user ที่จะส่งกลับ
const shapeUser = (user, roles = []) => ({
  id: user.id,
  name: user.name,
  lastname: user.lastname,
  email: user.email,
  roles,
});

// POST /api/auth/signin
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // validate input เบื้องต้น
    if (!email || !password) {
      return res.status(400).json({ message: "กรุณากรอกอีเมลและรหัสผ่าน" });
    }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email)) {
      return res.status(400).json({ message: "รูปแบบอีเมลไม่ถูกต้อง" });
    }

    // หา user ตามอีเมล
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "Email not found." });

    // เทียบรหัสผ่าน (ฐานข้อมูลเก็บเป็น bcrypt hash)
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).json({ message: "Invalid Password." });
    }

    // รวบรวม role (ถ้ามี association)
    let roles = [];
    if (typeof user.getRoles === "function") {
      const r = await user.getRoles();
      roles = r.map((x) => "ROLE_" + String(x.name || "").toUpperCase());
    }

    // สร้าง JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.SECRET_KEY || "dev-secret",
      { algorithm: "HS256", expiresIn: "1d" }
    );

    // ส่งกลับตามรูปแบบที่ฝั่ง frontend ใช้
    return res.status(200).json({
      user: shapeUser(user, roles),
      accessToken: token,
      message: "เข้าสู่ระบบสำเร็จ",
    });
  } catch (err) {
    console.error("signin error:", err);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};

// POST /api/hash   (ยูทิลิตี้: แฮชรหัสผ่านเพื่อเตรียมใส่ฐานข้อมูล)
exports.hashPassword = (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    const hashed = bcrypt.hashSync(password, 10); // ใช้ saltRounds=10
    return res.status(200).json({ hashed });
  } catch (err) {
    console.error("hashPassword error:", err);
    return res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
};

// POST /api/auth/logout (ออปชัน)
// - ถ้าใช้ cookie-session ให้ล้าง cookie ที่นี่
// - ถ้าใช้ Bearer token ฝั่ง client: ไม่มีอะไรต้องทำที่ server มากนัก
exports.logout = (req, res) => {
  try {
    // กรณีใช้ cookie ชื่อ 'token'
    res.clearCookie && res.clearCookie("token");
    return res.status(200).json({ message: "ออกจากระบบแล้ว" });
  } catch (err) {
    console.error("logout error:", err);
    return res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
};

// (ออปชัน) GET /api/auth/me – ใช้ตรวจ token ปัจจุบัน
exports.me = async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = jwt.verify(token, process.env.SECRET_KEY || "dev-secret");
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(404).json({ message: "ไม่พบบัญชีผู้ใช้" });

    let roles = [];
    if (typeof user.getRoles === "function") {
      const r = await user.getRoles();
      roles = r.map((x) => "ROLE_" + String(x.name || "").toUpperCase());
    }

    return res.status(200).json({ user: shapeUser(user, roles) });
  } catch (err) {
    console.error("me error:", err);
    return res.status(401).json({ message: "โทเค็นไม่ถูกต้องหรือหมดอายุ" });
  }
};
