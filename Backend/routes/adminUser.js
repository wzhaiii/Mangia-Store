const express = require('express');
const { sql, poolPromise } = require('../config/database');
const { LoiNghiepVu, xuLyLoi } = require('../utils/orderService');
 
// Được gắn vào admin.js nên đã kiểm tra đăng nhập + quyền admin
const router = express.Router();
 
// ─── GET /api/admin/users?search=&role=admin|user&page=1&limit=10
router.get('/users', async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const role   = ['admin', 'user'].includes(req.query.role) ? req.query.role : null;
 
    const pool = await poolPromise;
    const result = await pool.request()
      .input('search', sql.NVarChar(255), search ? `%${search}%` : null)
      .input('role', sql.VarChar(20), role)
      .input('offset', sql.Int, offset)
      .input('limit',  sql.Int, limit)
      .query(`
        SELECT u.id AS id, u.fullName AS fullName, u.email AS email,
               ISNULL(u.Role, 'user') AS role, u.IsLocked AS isLocked,
               ISNULL(u.provider, 'local') AS provider,
               (SELECT COUNT(*) FROM Orders o WHERE o.UserId = u.id) AS soDon,
               COUNT(*) OVER() AS totalCount
        FROM Users u
        WHERE (@search IS NULL OR u.fullName LIKE @search OR u.email LIKE @search)
          AND (@role IS NULL OR ISNULL(u.Role, 'user') = @role)
        ORDER BY u.id DESC
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
 
// ─── PUT /api/admin/users/:id/lock → khóa / mở khóa (body: { locked: true|false })
router.put('/users/:id/lock', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || typeof req.body.locked !== 'boolean') throw new LoiNghiepVu('Dữ liệu không hợp lệ');
    if (id === req.user.id) throw new LoiNghiepVu('Bạn không thể tự khóa tài khoản của mình');
    const pool = await poolPromise;
    const r = await pool.request()
      .input('id', sql.Int, id)
      .input('locked', sql.Bit, req.body.locked ? 1 : 0)
      .query('UPDATE Users SET IsLocked = @locked WHERE id = @id');
    if (!r.rowsAffected[0]) throw new LoiNghiepVu('Không tìm thấy người dùng', 404);
    res.json({ message: req.body.locked ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản' });
  } catch (err) {
    xuLyLoi(err, res);
  }
});
 
// ─── PUT /api/admin/users/:id/role → đổi quyền (body: { role: 'user' | 'admin' })
router.put('/users/:id/role', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const role = req.body.role;
    if (!id || !['user', 'admin'].includes(role)) throw new LoiNghiepVu('Dữ liệu không hợp lệ');
    // Chặn tự gỡ quyền của chính mình → luôn còn ít nhất 1 admin
    if (id === req.user.id) throw new LoiNghiepVu('Bạn không thể tự đổi quyền của mình');
    const pool = await poolPromise;
    const r = await pool.request()
      .input('id', sql.Int, id)
      .input('role', sql.VarChar(20), role)
      .query('UPDATE Users SET Role = @role WHERE id = @id');
    if (!r.rowsAffected[0]) throw new LoiNghiepVu('Không tìm thấy người dùng', 404);
    res.json({ message: 'Đã đổi quyền. Người đó cần đăng nhập lại để giao diện cập nhật.' });
  } catch (err) {
    xuLyLoi(err, res);
  }
});
 
module.exports = router;
 