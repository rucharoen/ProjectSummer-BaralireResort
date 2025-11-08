// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv/config");

process.env.TZ = process.env.TZ || "Asia/Bangkok";

const cron = require("node-cron");
const updateOverdue = require("./cron/updateOverdue");
const db = require("./app/models"); // Sequelize index.js
const promoRouter = require("./app/routes/promo");

const app = express();

/* ---------- Middlewares ---------- */
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
const UPLOADS_DIR = path.join(__dirname, "uploads");
app.use("/uploads", express.static(UPLOADS_DIR));
console.log("[static] serving:", UPLOADS_DIR);

/* ---------- Routes ---------- */
app.use("/api/promo", promoRouter);
app.get("/health", (req, res) => res.json({ ok: true }));

require("./app/routes/auth.routes")(app);
require("./app/routes/accommodation.routes")(app);
require("./app/routes/activity.routes")(app);
require("./app/routes/type.routes")(app);
require("./app/routes/payment.routes")(app);
require("./app/routes/award.routes")(app);
require("./app/routes/siteAsset.routes")(app);
require("./app/routes/cart.routes")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/booking.routes")(app);

/* ---------- DB & Cron ---------- */
db.sequelize
  .sync({ alter: false })
  .then(() => console.log("Database sync..."))
  .catch((err) => console.error("DB sync error:", err));

// เรียกครั้งแรกทันที (อัปเดตสถานะทันทีหลังบูต)
updateOverdue();

// ตั้ง cron ทุก 1 นาที (ตั้ง timezone ให้ตรง)
cron.schedule(
  "* * * * *",
  () => {
    updateOverdue();
  },
  { timezone: "Asia/Bangkok" }
);

/* ---------- Start server ---------- */
const PORT = process.env.SERVER_PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
