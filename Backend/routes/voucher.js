const express = require('express');
const { poolPromise } = require('../config/database');
const { verifyToken } = require('../middleware/authMiddleware');
const { xuLyLoi } = require('../utils/orderService');
const { kiemTraVoucher } = require('../utils/voucherService');

const router = express.Router();
router.use(verifyToken);

// POST /api/vouchers/check  body: { code, subtotal } → xem trước số tiền được giảm
router.post('/check', async (req, res) => {
  try {
    const subtotal = Number(req.body.subtotal) || 0;
    const pool = await poolPromise;
    const kq = await kiemTraVoucher(() => pool.request(), req.body.code, req.user.id, subtotal);
    res.json({ code: kq.code, discount: kq.discount });
  } catch (err) {
    xuLyLoi(err, res);
  }
});

module.exports = router;