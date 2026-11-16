const { sql } = require('../config/database');
const { LoiNghiepVu } = require('./orderService');

const chuanHoaMa = (s) => String(s || '').trim().toUpperCase();

// taoRequest = hàm trả về 1 request mới.
//   Ngoài giao dịch: () => pool.request()
//   Trong giao dịch: () => new sql.Request(transaction)
// Khóa dòng voucher (UPDLOCK) để 2 khách đặt cùng lúc không vượt quá số lượt dùng cho phép
async function kiemTraVoucher(taoRequest, code, userId, subtotal) {
  const ma = chuanHoaMa(code);
  if (!ma) throw new LoiNghiepVu('Vui lòng nhập mã giảm giá');

  const r = await taoRequest()
    .input('code', sql.VarChar(30), ma)
    .input('userId', sql.Int, userId)
    .query(`
      SELECT v.VoucherId, v.Code, v.DiscountType, v.DiscountValue, v.MaxDiscount,
             v.MinOrder, v.UsageLimit, v.UsedCount, v.PerUserLimit, v.IsActive,
             CASE WHEN v.StartsAt IS NOT NULL AND v.StartsAt > SYSDATETIME() THEN 1 ELSE 0 END AS chuaBatDau,
             CASE WHEN v.ExpiresAt IS NOT NULL AND v.ExpiresAt < SYSDATETIME() THEN 1 ELSE 0 END AS hetHan,
             (SELECT COUNT(*) FROM VoucherUsages u
              WHERE u.VoucherId = v.VoucherId AND u.UserId = @userId) AS daDung
      FROM Vouchers v WITH (UPDLOCK, ROWLOCK)
      WHERE v.Code = @code
    `);
  const v = r.recordset[0];

  if (!v || !v.IsActive) throw new LoiNghiepVu('Mã giảm giá không tồn tại hoặc đã ngừng áp dụng');
  if (v.chuaBatDau) throw new LoiNghiepVu('Mã giảm giá chưa đến thời gian áp dụng');
  if (v.hetHan) throw new LoiNghiepVu('Mã giảm giá đã hết hạn');
  if (v.UsageLimit !== null && v.UsedCount >= v.UsageLimit) {
    throw new LoiNghiepVu('Mã giảm giá đã hết lượt sử dụng');
  }
  if (v.daDung >= v.PerUserLimit) throw new LoiNghiepVu('Bạn đã dùng hết số lần cho phép của mã này');
  if (subtotal < Number(v.MinOrder)) {
    throw new LoiNghiepVu(
      `Đơn hàng cần tối thiểu ${Number(v.MinOrder).toLocaleString('vi-VN')} VNĐ để dùng mã này`
    );
  }

  let giam;
  if (v.DiscountType === 'percent') {
    giam = Math.floor((subtotal * Number(v.DiscountValue)) / 100);
    if (v.MaxDiscount !== null) giam = Math.min(giam, Number(v.MaxDiscount));
  } else {
    giam = Number(v.DiscountValue);
  }
  giam = Math.min(giam, subtotal); // không bao giờ giảm quá tiền hàng

  return { voucherId: v.VoucherId, code: v.Code, discount: giam };
}

module.exports = { kiemTraVoucher, chuanHoaMa };