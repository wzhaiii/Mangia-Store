const express = require('express');
const { sql, poolPromise } = require('../config/database');
const router = express.Router();

// Biến '/uploads/books/x.jpg' thành URL đầy đủ để thẻ <img> tải được
const withImageUrl = (req, row) => {
  const base = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  return { ...row, image: row.image ? base + row.image : null };
};

// ─── GET /api/books?page=1&limit=12&search=one&categoryId=1&sort=price_asc
// Trang danh sách: ảnh, tên, tác giả, thể loại, giá
router.get('/', async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit) || 12, 100);
    const offset = (page - 1) * limit;
    const search     = req.query.search || null;
    const categoryId = parseInt(req.query.categoryId) || null;

    // Danh sách trắng: tên cột không tham số hóa được nên chỉ cho phép giá trị có sẵn
    const sortMap = {
      newest:     'b.BookId DESC',
      price_asc:  'b.Price ASC, b.BookId ASC',
      price_desc: 'b.Price DESC, b.BookId ASC',
      title:      'b.Title ASC, b.BookId ASC',
    };
    const orderBy = sortMap[req.query.sort] || 'b.BookId ASC';
    const pool = await poolPromise;
    const result = await pool.request()
      .input('search',     sql.NVarChar(255), search ? `%${search}%` : null)
      .input('categoryId', sql.Int, categoryId)
      .input('offset',     sql.Int, offset)
      .input('limit',      sql.Int, limit)
      .query(`
        SELECT b.BookId   AS id,
               b.Title    AS title,
               b.Author   AS author,
               c.Name     AS category,
               b.Price    AS price,
               b.ImageUrl AS image,
               ISNULL((SELECT SUM(v.Stock) FROM BookVolumes v
               WHERE v.BookId = b.BookId AND v.IsActive = 1), 0) AS totalStock,
               COUNT(*) OVER() AS totalCount
        FROM Books b
        JOIN Categories c ON c.CategoryId = b.CategoryId
        WHERE b.IsActive = 1 AND c.IsActive = 1
          AND (@search     IS NULL OR b.Title LIKE @search)
          AND (@categoryId IS NULL OR b.CategoryId = @categoryId)
        ORDER BY ${orderBy}
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
      `);
    const rows  = result.recordset;
    const total = rows[0]?.totalCount || 0;
    res.json({
      data: rows.map(({ totalCount, ...r }) => withImageUrl(req, r)),
      page, limit, total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// ─── GET /api/books/:id
// Trang chi tiết: thông tin bộ + mô tả + danh sách các tập
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID không hợp lệ' });
    const pool = await poolPromise;
    const bookResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT b.BookId      AS id,
               b.Title       AS title,
               b.Author      AS author,
               c.Name        AS category,
               b.Price       AS price,
               b.ImageUrl    AS image,
               b.Descrip     AS descrip
        FROM Books b JOIN Categories c ON c.CategoryId = b.CategoryId
        WHERE b.BookId = @id AND b.IsActive = 1 AND c.IsActive = 1
      `);

    if (!bookResult.recordset.length)
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    const volumeResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT VolumeId AS id, VolumeNo AS volumeNo, Stock AS stock, ImageUrl AS image
        FROM BookVolumes
        WHERE BookId = @id AND IsActive = 1
        ORDER BY VolumeNo
      `);
    res.json(withImageUrl(req, {
      ...bookResult.recordset[0],
      volumes: volumeResult.recordset.map((v) => withImageUrl(req, v)),
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

module.exports = router;