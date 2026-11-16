const express = require('express');
const { sql, poolPromise } = require('../config/database');
const { verifyToken } = require('../middleware/authMiddleware');
const { LoiNghiepVu, xuLyLoi } = require('../utils/orderService');

const router = express.Router();

// Khách đã mua bộ truyện này chưa? "Đã mua" = có ít nhất 1 đơn ĐÃ GIAO chứa 1 tập của bộ đó
async function daMuaSach(pool, userId, bookId) {
  const r = await pool.request()
    .input('userId', sql.Int, userId)
    .input('bookId', sql.Int, bookId)
    .query(`
      SELECT TOP 1 1 AS ok
      FROM Orders o
      JOIN OrderDetails od ON od.OrderId  = o.OrderId
      JOIN BookVolumes v   ON v.VolumeId  = od.VolumeId
      WHERE o.UserId = @userId AND o.Status = 'delivered' AND v.BookId = @bookId
    `);
  return r.recordset.length > 0;
}

// Kiểm tra số sao + bình luận khách gửi lên, trả về dữ liệu đã làm sạch
function docNoiDung(body) {
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new LoiNghiepVu('Vui lòng chọn số sao từ 1 đến 5');
  }
  const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
  if (comment.length > 1000) throw new LoiNghiepVu('Bình luận tối đa 1000 ký tự');
  return { rating, comment: comment || null };
}

// ─── GET /api/reviews/book/:bookId?page=1&limit=5 → AI CŨNG XEM ĐƯỢC (không cần đăng nhập)
// Trả về: thống kê (trung bình, số lượt từng mức sao) + danh sách đánh giá đang hiện
router.get('/book/:bookId', async (req, res) => {
  try {
    const bookId = parseInt(req.params.bookId);
    if (!bookId) throw new LoiNghiepVu('Mã truyện không hợp lệ');
    const page   = Math.max(parseInt(req.query.page) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit) || 5, 50);
    const offset = (page - 1) * limit;

    const pool = await poolPromise;
    const tk = await pool.request()
      .input('bookId', sql.Int, bookId)
      .query(`
        SELECT COUNT(*) AS tong,
               ISNULL(AVG(CAST(Rating AS FLOAT)), 0) AS trungBinh,
               ISNULL(SUM(CASE WHEN Rating = 1 THEN 1 ELSE 0 END), 0) AS s1,
               ISNULL(SUM(CASE WHEN Rating = 2 THEN 1 ELSE 0 END), 0) AS s2,
               ISNULL(SUM(CASE WHEN Rating = 3 THEN 1 ELSE 0 END), 0) AS s3,
               ISNULL(SUM(CASE WHEN Rating = 4 THEN 1 ELSE 0 END), 0) AS s4,
               ISNULL(SUM(CASE WHEN Rating = 5 THEN 1 ELSE 0 END), 0) AS s5
        FROM Reviews
        WHERE BookId = @bookId AND IsVisible = 1
      `);
    const t = tk.recordset[0];

    const ds = await pool.request()
      .input('bookId', sql.Int, bookId)
      .input('offset', sql.Int, offset)
      .input('limit',  sql.Int, limit)
      .query(`
        SELECT r.ReviewId AS id, r.Rating AS rating, r.Comment AS comment,
               r.CreatedAt AS createdAt, r.UpdatedAt AS updatedAt,
               u.fullName AS userName
        FROM Reviews r
        JOIN Users u ON u.id = r.UserId
        WHERE r.BookId = @bookId AND r.IsVisible = 1
        ORDER BY r.CreatedAt DESC, r.ReviewId DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    res.json({
      summary: {
        total: t.tong,
        average: Math.round(t.trungBinh * 10) / 10,   // làm tròn 1 chữ số thập phân, ví dụ 4.3
        counts: { 1: t.s1, 2: t.s2, 3: t.s3, 4: t.s4, 5: t.s5 },
      },
      data: ds.recordset,
      page, limit,
      totalPages: Math.max(Math.ceil(t.tong / limit), 1),
    });
  } catch (err) {
    xuLyLoi(err, res);
  }
});

// ─── GET /api/reviews/book/:bookId/mine → khách đang đăng nhập: đã mua chưa? đã đánh giá chưa?
router.get('/book/:bookId/mine', verifyToken, async (req, res) => {
  try {
    const bookId = parseInt(req.params.bookId);
    if (!bookId) throw new LoiNghiepVu('Mã truyện không hợp lệ');
    const pool = await poolPromise;
    const daMua = await daMuaSach(pool, req.user.id, bookId);
    const r = await pool.request()
      .input('userId', sql.Int, req.user.id)
      .input('bookId', sql.Int, bookId)
      .query(`
        SELECT ReviewId AS id, Rating AS rating, Comment AS comment,
               IsVisible AS isVisible, CreatedAt AS createdAt
        FROM Reviews WHERE UserId = @userId AND BookId = @bookId
      `);
    res.json({ daMua, review: r.recordset[0] || null });
  } catch (err) {
    xuLyLoi(err, res);
  }
});

// ─── POST /api/reviews/book/:bookId → gửi đánh giá mới (body: { rating, comment })
router.post('/book/:bookId', verifyToken, async (req, res) => {
  try {
    const bookId = parseInt(req.params.bookId);
    if (!bookId) throw new LoiNghiepVu('Mã truyện không hợp lệ');
    const { rating, comment } = docNoiDung(req.body);

    const pool = await poolPromise;
    const bk = await pool.request()
      .input('bookId', sql.Int, bookId)
      .query('SELECT 1 FROM Books WHERE BookId = @bookId');
    if (!bk.recordset.length) throw new LoiNghiepVu('Không tìm thấy truyện', 404);

    // Luật nghiệp vụ: phải mua và nhận hàng rồi mới được đánh giá
    if (!(await daMuaSach(pool, req.user.id, bookId))) {
      throw new LoiNghiepVu('Bạn cần mua và nhận hàng (đơn đã giao) trước khi đánh giá', 403);
    }
    const daCo = await pool.request()
      .input('userId', sql.Int, req.user.id)
      .input('bookId', sql.Int, bookId)
      .query('SELECT 1 FROM Reviews WHERE UserId = @userId AND BookId = @bookId');
    if (daCo.recordset.length) {
      throw new LoiNghiepVu('Bạn đã đánh giá truyện này rồi, hãy dùng nút Sửa');
    }

    await pool.request()
      .input('userId', sql.Int, req.user.id)
      .input('bookId', sql.Int, bookId)
      .input('rating', sql.TinyInt, rating)
      .input('comment', sql.NVarChar(1000), comment)
      .query(`
        INSERT INTO Reviews (BookId, UserId, Rating, Comment)
        VALUES (@bookId, @userId, @rating, @comment)
      `);
    res.status(201).json({ message: 'Cảm ơn bạn đã đánh giá' });
  } catch (err) {
    // Lỗi 2627 / 2601 của SQL Server = vi phạm UNIQUE (2 yêu cầu gửi cùng lúc)
    if (err.number === 2627 || err.number === 2601) {
      return res.status(400).json({ message: 'Bạn đã đánh giá truyện này rồi' });
    }
    xuLyLoi(err, res);
  }
});

// ─── PUT /api/reviews/:reviewId → sửa đánh giá CỦA CHÍNH MÌNH
router.put('/:reviewId', verifyToken, async (req, res) => {
  try {
    const reviewId = parseInt(req.params.reviewId);
    if (!reviewId) throw new LoiNghiepVu('Mã đánh giá không hợp lệ');
    const { rating, comment } = docNoiDung(req.body);
    const pool = await poolPromise;
    const r = await pool.request()
      .input('id', sql.Int, reviewId)
      .input('userId', sql.Int, req.user.id)
      .input('rating', sql.TinyInt, rating)
      .input('comment', sql.NVarChar(1000), comment)
      .query(`
        UPDATE Reviews
        SET Rating = @rating, Comment = @comment, UpdatedAt = SYSDATETIME()
        WHERE ReviewId = @id AND UserId = @userId
      `);
    // Điều kiện "UserId = @userId" đảm bảo không ai sửa được đánh giá của người khác
    if (!r.rowsAffected[0]) throw new LoiNghiepVu('Không tìm thấy đánh giá của bạn', 404);
    res.json({ message: 'Đã cập nhật đánh giá' });
  } catch (err) {
    xuLyLoi(err, res);
  }
});

// ─── DELETE /api/reviews/:reviewId → xóa đánh giá CỦA CHÍNH MÌNH
router.delete('/:reviewId', verifyToken, async (req, res) => {
  try {
    const reviewId = parseInt(req.params.reviewId);
    if (!reviewId) throw new LoiNghiepVu('Mã đánh giá không hợp lệ');
    const pool = await poolPromise;
    const r = await pool.request()
      .input('id', sql.Int, reviewId)
      .input('userId', sql.Int, req.user.id)
      .query('DELETE FROM Reviews WHERE ReviewId = @id AND UserId = @userId');
    if (!r.rowsAffected[0]) throw new LoiNghiepVu('Không tìm thấy đánh giá của bạn', 404);
    res.json({ message: 'Đã xóa đánh giá' });
  } catch (err) {
    xuLyLoi(err, res);
  }
});

module.exports = router;