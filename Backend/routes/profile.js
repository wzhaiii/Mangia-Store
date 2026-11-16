const express = require('express');
const bcrypt = require('bcrypt');
const { sql, poolPromise } = require('../config/database');
const { verifyToken } = require('../middleware/authMiddleware');
const { LoiNghiepVu, xuLyLoi } = require('../utils/orderService');

const router = express.Router();
router.use(verifyToken); // mọi đường dẫn trong file này đều bắt buộc đăng nhập

// Cắt khoảng trắng 2 đầu, kiểm tra độ dài tối đa. Chuỗi rỗng → null (xóa thông tin)
const chuoi = (v, toiDa, tenTruong) => {
  const s = typeof v === 'string' ? v.trim() : '';
  if (s.length > toiDa) throw new LoiNghiepVu(`${tenTruong} tối đa ${toiDa} ký tự`);
  return s || null;
};

// ─── GET /api/profile → xem thông tin của CHÍNH MÌNH
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const r = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query(`
        SELECT u.id AS id, u.fullName AS fullName, u.email AS email,
               ISNULL(u.Role, 'user') AS role,
               ISNULL(u.provider, 'local') AS provider,
               u.Phone AS phone, u.Address AS address, u.Ward AS ward, u.Province AS province,
               CAST(CASE WHEN u.password IS NULL THEN 0 ELSE 1 END AS BIT) AS coMatKhau,
               (SELECT COUNT(*) FROM Orders o WHERE o.UserId = u.id) AS soDon
        FROM Users u
        WHERE u.id = @id
      `);
    if (!r.recordset.length) throw new LoiNghiepVu('Không tìm thấy tài khoản', 404);
    res.json(r.recordset[0]);
  } catch (err) {
    xuLyLoi(err, res);
  }
});

// ─── PUT /api/profile → sửa thông tin cá nhân (không cho sửa email, quyền)
// body: { fullName, phone, address, ward, province }
router.put('/', async (req, res) => {
  try {
    const fullName = chuoi(req.body.fullName, 100, 'Họ tên');
    if (!fullName) throw new LoiNghiepVu('Vui lòng nhập họ tên');
    const phone = chuoi(req.body.phone, 15, 'Số điện thoại');
    if (phone && !/^0\d{9}$/.test(phone)) {
      throw new LoiNghiepVu('Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0');
    }
    const address  = chuoi(req.body.address, 255, 'Địa chỉ');
    const ward     = chuoi(req.body.ward, 100, 'Phường/Xã');
    const province = chuoi(req.body.province, 100, 'Tỉnh/Thành phố');

    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, req.user.id)          // lấy từ thẻ đăng nhập, KHÔNG lấy từ khách gửi
      .input('fullName', sql.NVarChar(100), fullName)
      .input('phone', sql.VarChar(15), phone)
      .input('address', sql.NVarChar(255), address)
      .input('ward', sql.NVarChar(100), ward)
      .input('province', sql.NVarChar(100), province)
      .query(`
        UPDATE Users
        SET fullName = @fullName, Phone = @phone, Address = @address,
            Ward = @ward, Province = @province
        WHERE id = @id
      `);
    res.json({ message: 'Đã lưu thông tin', fullName });
  } catch (err) {
    xuLyLoi(err, res);
  }
});

// ─── PUT /api/profile/password → đổi mật khẩu (body: { currentPassword, newPassword })
router.put('/password', async (req, res) => {
  try {
    const hienTai = String(req.body.currentPassword || '');
    const moi = String(req.body.newPassword || '');
    if (moi.length < 6) throw new LoiNghiepVu('Mật khẩu mới phải từ 6 ký tự');
    if (moi.length > 72) throw new LoiNghiepVu('Mật khẩu mới tối đa 72 ký tự');

    const pool = await poolPromise;
    const r = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query('SELECT password FROM Users WHERE id = @id');
    const hashCu = r.recordset[0]?.password;
    // Tài khoản tạo bằng Google không có mật khẩu
    if (!hashCu) throw new LoiNghiepVu('Tài khoản đăng nhập bằng Google không có mật khẩu để đổi');

    if (!(await bcrypt.compare(hienTai, hashCu))) {
      throw new LoiNghiepVu('Mật khẩu hiện tại không đúng');
    }
    if (hienTai === moi) throw new LoiNghiepVu('Mật khẩu mới phải khác mật khẩu hiện tại');

    const hashMoi = await bcrypt.hash(moi, 10);
    await pool.request()
      .input('id', sql.Int, req.user.id)
      .input('hash', sql.NVarChar(255), hashMoi)
      .query('UPDATE Users SET password = @hash WHERE id = @id');
    res.json({ message: 'Đã đổi mật khẩu' });
  } catch (err) {
    xuLyLoi(err, res);
  }
});

module.exports = router;