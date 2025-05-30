const express = require('express');
const router = express.Router();
const db = require('../models');
const Booking = db.booking;
const User = db.user;
const Accommodation = db.accommodation;

router.get('/mock-receipt/:id', async (req, res) => {
  const bookingId = req.params.id;

  try {
    const booking = await Booking.findOne({
      where: { id: bookingId },
      include: [
        { model: User, attributes: [] },
        { model: Accommodation, attributes: [] }
      ]
    });

    if (!booking) {
      return res.status(404).send('<h2>ไม่พบข้อมูลการจอง</h2>');
    }

    // ตรวจสอบ bookingStatus อย่างปลอดภัย
    const status = booking.bookingStatus?.toLowerCase();

    let statusMessage = '';
    let statusStyle = '';

    if (status === 'overdue') {
      statusMessage = '❌ การจองนี้ถูกยกเลิกเนื่องจากชำระเงินเกินเวลาที่กำหนด';
      statusStyle = 'color: #b00020; background: #ffe0e0;';
    } else if (status === 'paid') {
      statusMessage = '✅ การจองนี้สำเร็จ';
      statusStyle = 'color: #0f5132; background: #d1e7dd;';
    } else if (status === 'pending') {
      statusMessage = '⌛ การจองนี้รอชำระเงินภายใน 24 ชม.';
      statusStyle = 'color: #856404; background: #fff3cd;';
    } else {
      statusMessage = `ไม่สามารถระบุสถานะของการจองนี้ได้ (status: ${booking.bookingStatus})`;
      statusStyle = 'color: gray; background: #eeeeee;';
    }

    const html = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>สถานะการจอง</title>
        <style>
          body { font-family: Arial; background: #f0f0f0; padding: 2rem; }
          .container { background: white; padding: 1.5rem; max-width: 600px; margin: auto; border-radius: 8px; }
          .status { padding: 1rem; border-radius: 6px; margin-top: 1rem; ${statusStyle} }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>รายละเอียดการจอง</h2>
         
          <p><strong>เช็คอิน:</strong> ${booking.checkInDate}</p>
          <p><strong>เช็คเอาท์:</strong> ${booking.checkOutDate}</p>
          <p><strong>จำนวนเงิน:</strong> ${booking.totalPrice} บาท</p>
          <div class="status">
            ${statusMessage}<br>
            <strong>สถานะ:</strong> ${booking.bookingStatus}
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
    res.status(500).send('<h2>เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์</h2>');
  }
});

module.exports = router;
