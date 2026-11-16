const express = require('express');
const { sql, poolPromise } = require('../config/database');
const { LoiNghiepVu, xuLyLoi } = require('../utils/orderService');

// Được gắn vào admin.js nên đã kiểm tra đăng nhập + quyền admin
const router = express.Router();

// ─── GET /api/admin/reviews?search=&visible=1|0&page=1&limit=10
router.get('/reviews', async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    // '1' = chỉ đang hiện, '0' = chỉ đang bị ẩn, còn lại = tất cả
    const visible = req.query.visible === '1' ? 1 : req.query.visible === '0' ? 0 : null;

    const pool = await poolPromise;
    const result = await pool.request()
      .input('search', sql.NVarChar(255), search ? `%${search}%` : null)
      .input('visible', sql.Bit, visible)
      .input('offset', sql.Int, offset)
      .input('limit',  sql.Int, limit)
      .query(`
        SELECT r.ReviewId AS id, r.Rating AS rating, r.Comment AS comment,
               r.IsVisible AS isVisible, r.CreatedAt AS createdAt,
               b.BookId AS bookId, b.Title AS bookTitle,
               u.fullName AS userName, u.email AS userEmail,
               COUNT(*) OVER() AS totalCount
        FROM Reviews r
        JOIN Books b ON b.BookId = r.BookId
        JOIN Users u ON u.id     = r.UserId
        WHERE (@visible IS NULL OR r.IsVisible = @visible)
          AND (@search IS NULL OR b.Title LIKE @search OR u.fullName LIKE @search
               OR u.email LIKE @search OR r.Comment LIKE @search)
        ORDER BY r.ReviewId DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    const rows  = result.recordset;
    const total = rows[0]?.totalCount || 0;
    res.json({
      data: rows.map(({ totalCount, ...r }) => r),
      page, limit, total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    xuLyLoi(err, res);
  }
});

// ─── PUT /api/admin/reviews/:id/visibility → ẩn / hiện (body: { visible: true|false })
router.put('/reviews/:id/visibility', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || typeof req.body.visible !== 'boolean') throw new LoiNghiepVu('Dữ liệu không hợp lệ');
    const pool = await poolPromise;
    const r = await pool.request()
      .input('id', sql.Int, id)
      .input('visible', sql.Bit, req.body.visible ? 1 : 0)
      .query('UPDATE Reviews SET IsVisible = @visible WHERE ReviewId = @id');
    if (!r.rowsAffected[0]) throw new LoiNghiepVu('Không tìm thấy đánh giá', 404);
    res.json({ message: req.body.visible ? 'Đã hiện đánh giá' : 'Đã ẩn đánh giá' });
  } catch (err) {
    xuLyLoi(err, res);
  }
});

module.exports = router;