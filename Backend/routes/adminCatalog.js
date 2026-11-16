const express = require('express');
const { sql, poolPromise } = require('../config/database');
const { LoiNghiepVu, xuLyLoi } = require('../utils/orderService');
// File này được gắn vào admin.js, nên đã được kiểm tra đăng nhập + quyền admin từ trước.
const router = express.Router();
// ===== Các hàm nhỏ hỗ trợ đọc dữ liệu khách gửi lên =====
const layBase = (req) => process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
const urlDayDu = (req, path) => (path ? layBase(req) + path : null);
// Chuỗi rỗng/không phải chuỗi → null. Còn lại cắt khoảng trắng 2 đầu
const chuoi = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
// Không gửi → null. Có gửi → chuyển thành số
const so = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
// Không gửi → null (giữ nguyên giá trị cũ). true/false → 1/0 cho kiểu BIT của SQL Server
const bit = (v) => (v === undefined || v === null ? null : v === true || v === 1 || v === 'true' ? 1 : 0);
const kiemTraAnh = (p) => {
  if (p && !p.startsWith('/uploads/')) {
    throw new LoiNghiepVu('Đường dẫn ảnh phải bắt đầu bằng /uploads/');
  }
};
// ======================= THỂ LOẠI =======================
router.get('/categories', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT c.CategoryId AS id, c.Name AS name, c.IsActive AS isActive,
             (SELECT COUNT(*) FROM Books b WHERE b.CategoryId = c.CategoryId) AS bookCount
      FROM Categories c
      ORDER BY c.CategoryId
    `);
    res.json(result.recordset);
  } catch (err) {
    xuLyLoi(err, res);
  }
});
router.post('/categories', async (req, res) => {
  try {
    const name = chuoi(req.body.name);
    if (!name) throw new LoiNghiepVu('Vui lòng nhập tên thể loại');
    const pool = await poolPromise;
    const trung = await pool.request()
      .input('name', sql.NVarChar(100), name)
      .query('SELECT 1 FROM Categories WHERE Name = @name');
    if (trung.recordset.length) throw new LoiNghiepVu('Thể loại này đã tồn tại');
    await pool.request()
      .input('name', sql.NVarChar(100), name)
      .query('INSERT INTO Categories (Name) VALUES (@name)');
    res.status(201).json({ message: 'Đã thêm thể loại' });
  } catch (err) {
    xuLyLoi(err, res);
  }
});
 
// Đổi tên và/hoặc ẩn-hiện. Trường nào không gửi lên thì giữ nguyên (nhờ COALESCE)
router.put('/categories/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) throw new LoiNghiepVu('Mã thể loại không hợp lệ');
    const name = chuoi(req.body.name);
    const isActive = bit(req.body.isActive);
    if (name === null && isActive === null) throw new LoiNghiepVu('Không có gì để cập nhật');
    const pool = await poolPromise;
    if (name !== null) {
      const trung = await pool.request()
        .input('name', sql.NVarChar(100), name)
        .input('id', sql.Int, id)
        .query('SELECT 1 FROM Categories WHERE Name = @name AND CategoryId <> @id');
      if (trung.recordset.length) throw new LoiNghiepVu('Tên thể loại này đã tồn tại');
    }
    const r = await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar(100), name)
      .input('isActive', sql.Bit, isActive)
      .query(`
        UPDATE Categories
        SET Name = COALESCE(@name, Name), IsActive = COALESCE(@isActive, IsActive)
        WHERE CategoryId = @id
      `);
    if (!r.rowsAffected[0]) throw new LoiNghiepVu('Không tìm thấy thể loại', 404);
    res.json({ message: 'Đã cập nhật thể loại' });
  } catch (err) {
    xuLyLoi(err, res);
  }
});
 
// ======================= TRUYỆN (BỘ TRUYỆN) =======================
// GET /api/admin/books?search=&page=1&limit=10  → liệt kê CẢ truyện đang ẩn
router.get('/books', async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
 
    const pool = await poolPromise;
    const result = await pool.request()
      .input('search', sql.NVarChar(255), search ? `%${search}%` : null)
      .input('offset', sql.Int, offset)
      .input('limit',  sql.Int, limit)
      .query(`
        SELECT b.BookId AS id, b.Title AS title, b.Author AS author,
               b.CategoryId AS categoryId, c.Name AS category,
               b.Price AS price, b.ImageUrl AS imageUrl, b.IsActive AS isActive,
               (SELECT COUNT(*) FROM BookVolumes v WHERE v.BookId = b.BookId) AS volumeCount,
               COUNT(*) OVER() AS totalCount
        FROM Books b
        JOIN Categories c ON c.CategoryId = b.CategoryId
        WHERE (@search IS NULL OR b.Title LIKE @search OR b.Author LIKE @search)
        ORDER BY b.BookId DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    const rows  = result.recordset;
    const total = rows[0]?.totalCount || 0;
    res.json({
      data: rows.map(({ totalCount, ...r }) => ({ ...r, image: urlDayDu(req, r.imageUrl) })),
      page, limit, total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    xuLyLoi(err, res);
  }
});
 
// GET /api/admin/books/:id → 1 truyện + mô tả + TẤT CẢ các tập (kể cả tập đang ẩn)
router.get('/books/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) throw new LoiNghiepVu('Mã truyện không hợp lệ');
    const pool = await poolPromise;
    const b = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT b.BookId AS id, b.Title AS title, b.Author AS author,
               b.CategoryId AS categoryId, b.Price AS price,
               b.ImageUrl AS imageUrl, b.Descrip AS descrip, b.IsActive AS isActive
        FROM Books b WHERE b.BookId = @id
      `);
    if (!b.recordset.length) throw new LoiNghiepVu('Không tìm thấy truyện', 404);
    const v = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT VolumeId AS id, VolumeNo AS volumeNo, Stock AS stock,
               ImageUrl AS imageUrl, IsActive AS isActive
        FROM BookVolumes WHERE BookId = @id ORDER BY VolumeNo
      `);
    res.json({
      ...b.recordset[0],
      image: urlDayDu(req, b.recordset[0].imageUrl),
      volumes: v.recordset.map((x) => ({ ...x, image: urlDayDu(req, x.imageUrl) })),
    });
  } catch (err) {
    xuLyLoi(err, res);
  }
});
 
router.post('/books', async (req, res) => {
  try {
    const title = chuoi(req.body.title);
    const author = chuoi(req.body.author);
    const categoryId = so(req.body.categoryId);
    const price = so(req.body.price);
    const imageUrl = chuoi(req.body.imageUrl);
    const descrip = chuoi(req.body.descrip);
    if (!title || !author || !Number.isInteger(categoryId) || !Number.isFinite(price) || price < 0) {
      throw new LoiNghiepVu('Vui lòng nhập đủ tên, tác giả, thể loại và giá hợp lệ');
    }
    kiemTraAnh(imageUrl);
    const pool = await poolPromise;
    const cat = await pool.request()
      .input('c', sql.Int, categoryId)
      .query('SELECT 1 FROM Categories WHERE CategoryId = @c');
    if (!cat.recordset.length) throw new LoiNghiepVu('Thể loại không tồn tại');
    const r = await pool.request()
      .input('title', sql.NVarChar(255), title)
      .input('author', sql.NVarChar(255), author)
      .input('categoryId', sql.Int, categoryId)
      .input('price', sql.Decimal(18, 0), price)
      .input('imageUrl', sql.NVarChar(255), imageUrl)
      .input('descrip', sql.NVarChar(sql.MAX), descrip)
      .query(`
        INSERT INTO Books (Title, Author, CategoryId, Price, ImageUrl, Descrip)
        OUTPUT INSERTED.BookId
        VALUES (@title, @author, @categoryId, @price, @imageUrl, @descrip)
      `);
    res.status(201).json({ message: 'Đã thêm truyện', id: r.recordset[0].BookId });
  } catch (err) {
    xuLyLoi(err, res);
  }
});
 
// Sửa thông tin và/hoặc ẩn-hiện. Trường nào không gửi (hoặc để trống) thì giữ nguyên
router.put('/books/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) throw new LoiNghiepVu('Mã truyện không hợp lệ');
    const b = req.body;
    const title = chuoi(b.title);
    const author = chuoi(b.author);
    const categoryId = so(b.categoryId);
    const price = so(b.price);
    const imageUrl = chuoi(b.imageUrl);
    const descrip = chuoi(b.descrip);
    const isActive = bit(b.isActive);
    if (categoryId !== null && !Number.isInteger(categoryId)) throw new LoiNghiepVu('Thể loại không hợp lệ');
    if (price !== null && (!Number.isFinite(price) || price < 0)) throw new LoiNghiepVu('Giá không hợp lệ');
    kiemTraAnh(imageUrl);
 
    const pool = await poolPromise;
    if (categoryId !== null) {
      const cat = await pool.request()
        .input('c', sql.Int, categoryId)
        .query('SELECT 1 FROM Categories WHERE CategoryId = @c');
      if (!cat.recordset.length) throw new LoiNghiepVu('Thể loại không tồn tại');
    }
    const r = await pool.request()
      .input('id', sql.Int, id)
      .input('title', sql.NVarChar(255), title)
      .input('author', sql.NVarChar(255), author)
      .input('categoryId', sql.Int, categoryId)
      .input('price', sql.Decimal(18, 0), price)
      .input('imageUrl', sql.NVarChar(255), imageUrl)
      .input('descrip', sql.NVarChar(sql.MAX), descrip)
      .input('isActive', sql.Bit, isActive)
      .query(`
        UPDATE Books SET
          Title      = COALESCE(@title, Title),
          Author     = COALESCE(@author, Author),
          CategoryId = COALESCE(@categoryId, CategoryId),
          Price      = COALESCE(@price, Price),
          ImageUrl   = COALESCE(@imageUrl, ImageUrl),
          Descrip    = COALESCE(@descrip, Descrip),
          IsActive   = COALESCE(@isActive, IsActive)
        WHERE BookId = @id
      `);
    if (!r.rowsAffected[0]) throw new LoiNghiepVu('Không tìm thấy truyện', 404);
    res.json({ message: 'Đã cập nhật truyện' });
  } catch (err) {
    xuLyLoi(err, res);
  }
});
 
// ======================= TẬP =======================
// Thêm tập mới: tồn kho bắt đầu bằng 0, muốn có hàng thì vào trang Kho để nhập
router.post('/books/:id/volumes', async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    const volumeNo = so(req.body.volumeNo);
    const imageUrl = chuoi(req.body.imageUrl);
    if (!bookId) throw new LoiNghiepVu('Mã truyện không hợp lệ');
    if (!Number.isInteger(volumeNo) || volumeNo < 1) throw new LoiNghiepVu('Số tập phải là số nguyên từ 1 trở lên');
    kiemTraAnh(imageUrl);
 
    const pool = await poolPromise;
    const bk = await pool.request().input('b', sql.Int, bookId).query('SELECT 1 FROM Books WHERE BookId = @b');
    if (!bk.recordset.length) throw new LoiNghiepVu('Không tìm thấy truyện', 404);
    const trung = await pool.request()
      .input('b', sql.Int, bookId)
      .input('n', sql.Int, volumeNo)
      .query('SELECT 1 FROM BookVolumes WHERE BookId = @b AND VolumeNo = @n');
    if (trung.recordset.length) throw new LoiNghiepVu(`Tập ${volumeNo} đã tồn tại`);
 
    await pool.request()
      .input('b', sql.Int, bookId)
      .input('n', sql.Int, volumeNo)
      .input('imageUrl', sql.NVarChar(255), imageUrl)
      .query('INSERT INTO BookVolumes (BookId, VolumeNo, Stock, ImageUrl) VALUES (@b, @n, 0, @imageUrl)');
    res.status(201).json({ message: `Đã thêm Tập ${volumeNo}` });
  } catch (err) {
    xuLyLoi(err, res);
  }
});
 
// Sửa số tập / ảnh / ẩn-hiện 1 tập. (Tồn kho KHÔNG sửa ở đây, phải qua trang Kho để có lịch sử)
router.put('/volumes/:volumeId', async (req, res) => {
  try {
    const volumeId = parseInt(req.params.volumeId);
    if (!volumeId) throw new LoiNghiepVu('Mã tập không hợp lệ');
    const volumeNo = so(req.body.volumeNo);
    const imageUrl = chuoi(req.body.imageUrl);
    const isActive = bit(req.body.isActive);
    if (volumeNo !== null && (!Number.isInteger(volumeNo) || volumeNo < 1)) {
      throw new LoiNghiepVu('Số tập phải là số nguyên từ 1 trở lên');
    }
    kiemTraAnh(imageUrl);
 
    const pool = await poolPromise;
    const cur = await pool.request()
      .input('id', sql.Int, volumeId)
      .query('SELECT BookId FROM BookVolumes WHERE VolumeId = @id');
    if (!cur.recordset.length) throw new LoiNghiepVu('Không tìm thấy tập', 404);
    if (volumeNo !== null) {
      const trung = await pool.request()
        .input('b', sql.Int, cur.recordset[0].BookId)
        .input('n', sql.Int, volumeNo)
        .input('id', sql.Int, volumeId)
        .query('SELECT 1 FROM BookVolumes WHERE BookId = @b AND VolumeNo = @n AND VolumeId <> @id');
      if (trung.recordset.length) throw new LoiNghiepVu(`Tập ${volumeNo} đã tồn tại`);
    }
    await pool.request()
      .input('id', sql.Int, volumeId)
      .input('n', sql.Int, volumeNo)
      .input('imageUrl', sql.NVarChar(255), imageUrl)
      .input('isActive', sql.Bit, isActive)
      .query(`
        UPDATE BookVolumes SET
          VolumeNo = COALESCE(@n, VolumeNo),
          ImageUrl = COALESCE(@imageUrl, ImageUrl),
          IsActive = COALESCE(@isActive, IsActive)
        WHERE VolumeId = @id
      `);
    res.json({ message: 'Đã cập nhật tập' });
  } catch (err) {
    xuLyLoi(err, res);
  }
});
 
module.exports = router;
 