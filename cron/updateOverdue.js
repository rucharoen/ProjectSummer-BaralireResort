// cron/updateOverdue.js
"use strict";

const db = require("../app/models");
const { Op } = require("sequelize");

module.exports = async function updateOverdue() {
  const Payment = db.payment;
  const Booking = db.booking;

  const now = new Date();

  try {
    // หา payment ที่เลยกำหนดชำระแล้วและยังเป็น Pending
    const overduePays = await Payment.findAll({
      where: {
        paymentStatus: "Pending",
        // <<< ชื่อฟิลด์ฝั่ง model ของคุณคือ due_Date >>>
        due_Date: { [Op.lt]: now },
      },
      attributes: ["id"],
      raw: true,
    });

    if (!overduePays.length) {
      console.log("[cron] No overdue payments at", now.toISOString());
      return;
    }

    const ids = overduePays.map((p) => p.id);

    // อัปเดตสถานะ payment -> Overdue
    const [pCount] = await Payment.update(
      { paymentStatus: "Overdue" },
      { where: { id: ids } }
    );

    // อัปเดต booking ที่ผูกกับ payment เหล่านี้ด้วย (ถ้ายัง Pending)
    const [bCount] = await Booking.update(
      { bookingStatus: "Overdue" },
      {
        where: {
          paymentId: { [Op.in]: ids },
          bookingStatus: "Pending",
        },
      }
    );

    console.log(
      `[cron] Marked Overdue: payments=${pCount}, bookings=${bCount} @ ${now.toISOString()}`
    );
  } catch (err) {
    console.error("[cron] updateOverdue error:", err?.message || err);
  }
};
