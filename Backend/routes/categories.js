const express = require('express');
const { poolPromise } = require('../config/database');
const router = express.Router();

// GET /api/categories → trả về danh sách thể loại để hiển thị nút lọc
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
     SELECT CategoryId AS id, Name AS name FROM Categories WHERE IsActive = 1 ORDER BY CategoryId
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

module.exports = router;