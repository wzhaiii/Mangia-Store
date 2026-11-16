const jwt = require('jsonwebtoken');
const { sql, poolPromise } = require('../config/database');
 
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(401).json({ message: 'Chưa đăng nhập' });
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ' });
    try {
      // Hỏi lại database: tài khoản còn tồn tại và có đang bị khóa không?
      // (Nếu chỉ tin thẻ đăng nhập thì người bị khóa vẫn dùng được thẻ cũ đến hết hạn 1 ngày)
      const pool = await poolPromise;
      const r = await pool.request()
        .input('id', sql.Int, decoded.id)
        .query('SELECT IsLocked FROM Users WHERE id = @id');
      if (!r.recordset.length) {
        return res.status(401).json({ message: 'Tài khoản không tồn tại' });
      }
      if (r.recordset[0].IsLocked) {
        return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa' });
      }
      req.user = decoded;
      next();
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  });
};
 
exports.requireAdmin = async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const r = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query('SELECT Role FROM Users WHERE id = @id');
    if (r.recordset[0]?.Role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền quản trị' });
    }
    next(); // đúng admin thì cho đi tiếp vào phần xử lý chính
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};
 