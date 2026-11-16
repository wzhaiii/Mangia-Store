const express = require('express');
const { sql, poolPromise } = require('../config/database');
const { LoiNghiepVu, xuLyLoi } = require('../utils/orderService');
const { chuanHoaMa } = require('../utils/voucherService');

// Được gắn vào admin.js nên đã kiểm tra đăng nhập + quyền admin
const router = express.Router();

const so = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
const ngay = (v, ten) => {
  if (v === undefined || v === null || v === '') return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) throw new LoiNghiepVu(`${ten} không hợp lệ`);
  return d;
};

// Đọc và kiểm tra các trường của form mã giảm giá
function docVoucher(b) {
  const discountType = b.discountType;
  if (!['percent', 'fixed'].includes(discountType)) throw new LoiNghiepVu('Loại giảm giá không hợp lệ');
  const discountValue = so(b.discountValue);
  if (!Number.isInteger(discountValue) || discountValue <= 0) {
    throw new LoiNghiepVu('Mức giảm phải là số nguyên lớn hơn 0');
  }
  if (discountType === 'percent' && discountValue > 100) throw new LoiNghiepVu('Giảm theo % không được quá 100');
  // Mức giảm tối đa chỉ có nghĩa với loại phần trăm
  let maxDiscount = discountType === 'percent' ? so(b.maxDiscount) : null;
  if (maxDiscount !== null && (!Number.isInteger(maxDiscount) || maxDiscount <= 0)) {
    throw new LoiNghiepVu('Mức giảm tối đa phải là số nguyên lớn hơn 0');
  }
  const minOrder = so(b.minOrder) ?? 0;
  if (!Number.isInteger(minOrder) || minOrder < 0) throw new LoiNghiepVu('Đơn tối thiểu không hợp lệ');
  const usageLimit = so(b.usageLimit);
  if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit < 1)) {
    throw new LoiNghiepVu('Tổng số lượt dùng phải từ 1 trở lên (hoặc để trống nếu không giới hạn)');
  }
  const perUserLimit = so(b.perUserLimit) ?? 1;
  if (!Number.isInteger(perUserLimit) || perUserLimit < 1) {
    throw new LoiNghiepVu('Số lần mỗi khách được dùng phải từ 1 trở lên');
  }
  const startsAt = ngay(b.startsAt, 'Ngày bắt đầu');
  const expiresAt = ngay(b.expiresAt, 'Ngày hết hạn');
  if (startsAt && expiresAt && expiresAt <= startsAt) {
    throw new LoiNghiepVu('Ngày hết hạn phải sau ngày bắt đầu');
  }
  return { discountType, discountValue, maxDiscount, minOrder, usageLimit, perUserLimit, startsAt, expiresAt };
}

const gan = (req, d) =>
  req
    .input('type', sql.VarChar(10), d.discountType)
    .input('value', sql.Decimal(18, 0), d.discountValue)
    .input('max', sql.Decimal(18, 0), d.maxDiscount)
    .input('min', sql.Decimal(18, 0), d.minOrder)
    .input('limit', sql.Int, d.usageLimit)
    .input('perUser', sql.Int, d.perUserLimit)
    .input('starts', sql.DateTime2, d.startsAt)
    .input('expires', sql.DateTime2, d.expiresAt);

// ─── GET /api/admin/vouchers → toàn bộ mã (số lượng ít nên không phân trang)
router.get('/vouchers', async (req, res) => {
  try {
    const pool = await poolPromise;
    const r = await pool.request().query(`
      SELECT VoucherId AS id, Code AS code, DiscountType AS discountType, DiscountValue AS discountValue,
             MaxDiscount AS maxDiscount, MinOrder AS minOrder, UsageLimit AS usageLimit,
             UsedCount AS usedCount, PerUserLimit AS perUserLimit, StartsAt AS startsAt,
             ExpiresAt AS expiresAt, IsActive AS isActive,
             CASE WHEN ExpiresAt IS NOT NULL AND ExpiresAt < SYSDATETIME() THEN 1 ELSE 0 END AS hetHan
      FROM Vouchers
      ORDER BY VoucherId DESC
    `);
    res.json(r.recordset);
  } catch (err) {
    xuLyLoi(err, res);
  }
});

// ─── POST /api/admin/vouchers → tạo mã mới
router.post('/vouchers', async (req, res) => {
  try {
    const code = chuanHoaMa(req.body.code);
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      throw new LoiNghiepVu('Mã chỉ gồm chữ, số, dấu - hoặc _ và dài 3 đến 30 ký tự');
    }
    const d = docVoucher(req.body);
    const pool = await poolPromise;
    const trung = await pool.request().input('code', sql.VarChar(30), code)
      .query('SELECT 1 FROM Vouchers WHERE Code = @code');
    if (trung.recordset.length) throw new LoiNghiepVu('Mã này đã tồn tại');

    await gan(pool.request().input('code', sql.VarChar(30), code), d).query(`
      INSERT INTO Vouchers (Code, DiscountType, DiscountValue, MaxDiscount, MinOrder,
                            UsageLimit, PerUserLimit, StartsAt, ExpiresAt)
      VALUES (@code, @type, @value, @max, @min, @limit, @perUser, @starts, @expires)
    `);
    res.status(201).json({ message: 'Đã tạo mã giảm giá' });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601) {
      return res.status(400).json({ message: 'Mã này đã tồn tại' });
    }
    xuLyLoi(err, res);
  }
});

// ─── PUT /api/admin/vouchers/:id → sửa mã (không đổi được Code và UsedCount)
router.put('/vouchers/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) throw new LoiNghiepVu('Mã không hợp lệ');
    const d = docVoucher(req.body);
    const pool = await poolPromise;
    const cur = await pool.request().input('id', sql.Int, id)
      .query('SELECT UsedCount FROM Vouchers WHERE VoucherId = @id');
    if (!cur.recordset.length) throw new LoiNghiepVu('Không tìm thấy mã giảm giá', 404);
    if (d.usageLimit !== null && d.usageLimit < cur.recordset[0].UsedCount) {
      throw new LoiNghiepVu(`Mã đã được dùng ${cur.recordset[0].UsedCount} lượt, tổng số lượt không thể nhỏ hơn con số này`);
    }
    await gan(pool.request().input('id', sql.Int, id), d).query(`
      UPDATE Vouchers SET DiscountType = @type, DiscountValue = @value, MaxDiscount = @max,
             MinOrder = @min, UsageLimit = @limit, PerUserLimit = @perUser,
             StartsAt = @starts, ExpiresAt = @expires
      WHERE VoucherId = @id
    `);
    res.json({ message: 'Đã cập nhật mã giảm giá' });
  } catch (err) {
    xuLyLoi(err, res);
  }
});

// ─── PUT /api/admin/vouchers/:id/active → bật/tắt (body: { isActive })
router.put('/vouchers/:id/active', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || typeof req.body.isActive !== 'boolean') throw new LoiNghiepVu('Dữ liệu không hợp lệ');
    const pool = await poolPromise;
    const r = await pool.request()
      .input('id', sql.Int, id)
      .input('a', sql.Bit, req.body.isActive ? 1 : 0)
      .query('UPDATE Vouchers SET IsActive = @a WHERE VoucherId = @id');
    if (!r.rowsAffected[0]) throw new LoiNghiepVu('Không tìm thấy mã giảm giá', 404);
    res.json({ message: req.body.isActive ? 'Đã bật mã giảm giá' : 'Đã tắt mã giảm giá' });
  } catch (err) {
    xuLyLoi(err, res);
  }
});

module.exports = router;