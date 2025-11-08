// app/routes/promo.js  (CommonJS)
const express = require("express");
const router = express.Router();

const { sequelize, Sequelize } = require("../models"); // ✅ ใช้ Sequelize เดิม

router.get("/prices", async (req, res) => {
  try {
    const rows = await sequelize.query(
      `SELECT * FROM public.v_active_promotion_prices
       ORDER BY room_type, accommodation_name`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    res.json(rows);
  } catch (err) {
    console.error("[/api/promo/prices] DB ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/best", async (req, res) => {
  try {
    const rows = await sequelize.query(
      `SELECT * FROM public.v_best_promotion_price_per_accommodation
       ORDER BY accommodation_id`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    res.json(rows);
  } catch (err) {
    console.error("[/api/promo/best] DB ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
