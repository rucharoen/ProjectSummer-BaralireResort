// app/routes/type.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/type.controller');

// ==========================
// Type Routes
// ==========================

// ดึงข้อมูลประเภทห้องทั้งหมด
router.get('/', controller.getAll);

// ดึงข้อมูลประเภทห้องตาม ID
router.get('/:id', controller.getById);

module.exports = (app) => {
  app.use('/api/type', router);
};
