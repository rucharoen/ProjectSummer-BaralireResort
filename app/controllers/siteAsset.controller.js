// app/controllers/siteAsset.controller.js
const db = require("../models");
const SiteAsset = db.siteAsset;

// สร้างข้อมูลใหม่
exports.create = async (req, res) => {
  try {
    const { type, url, title, alt_text, sort_order, is_active } = req.body;
    const item = await SiteAsset.create({ type, url, title, alt_text, sort_order, is_active });
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ดึงรายการทั้งหมด (กรองตาม type ได้)
exports.findAll = async (req, res) => {
  try {
    const where = {};
    if (req.query.type) where.type = req.query.type; // ?type=logo|certificate|hero
    if (req.query.active === "1") where.is_active = true; // ?active=1
    const items = await SiteAsset.findAll({
      where,
      order: [["sort_order", "ASC"], ["id", "DESC"]],
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ดึงรายการล่าสุดตาม type (เช่น โลโก้ล่าสุด, ฮีโร่ล่าสุด)
exports.findLatestByType = async (req, res) => {
  try {
    const { type } = req.params; // /latest/logo
    const item = await SiteAsset.findOne({
      where: { type, is_active: true },
      order: [["id", "DESC"]],
    });
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// อัปเดต
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    await SiteAsset.update(req.body, { where: { id } });
    const updated = await SiteAsset.findByPk(id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ลบ
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    await SiteAsset.destroy({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
