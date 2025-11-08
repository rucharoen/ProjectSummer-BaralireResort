// app/scripts/checkReceipts.js
"use strict";

const db = require("../models");

(async () => {
  try {
    console.log("📦 Checking receipts table...");
    const rows = await db.receipt.findAll({
      order: [["id", "ASC"]],
      limit: 10, // ดูแค่ 10 แถวแรกพอ
      raw: true,
    });

    if (!rows.length) {
      console.log("❌ ไม่พบข้อมูลในตาราง receipts");
    } else {
      console.log(`✅ พบข้อมูล ${rows.length} แถว ตัวอย่าง:`);
      console.table(rows);
    }
  } catch (err) {
    console.error("เกิดข้อผิดพลาดขณะตรวจสอบ:", err);
  } finally {
    await db.sequelize.close();
  }
})();
