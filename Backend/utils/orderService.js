const { sql } = require('../config/database');
class LoiNghiepVu extends Error {
  constructor(message, httpStatus = 400) {
    super(message);
    this.httpStatus = httpStatus;
  }
}
 
function xuLyLoi(err, res) {
  if (err instanceof LoiNghiepVu) {
    return res.status(err.httpStatus).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: 'Lỗi máy chủ' });
}
 
// Ghi 1 dòng vào lịch sử đổi trạng thái đơn. PHẢI gọi bên trong giao dịch (transaction).
// tu = null nghĩa là lúc vừa tạo đơn. nguoiDoiId = id người thực hiện (khách hoặc admin)
async function ghiLichSuTrangThai(transaction, orderId, tu, den, nguoiDoiId, ghiChu = null) {
  await new sql.Request(transaction)
    .input('orderId', sql.Int, orderId)
    .input('tu', sql.VarChar(20), tu)
    .input('den', sql.VarChar(20), den)
    .input('nguoiDoi', sql.Int, nguoiDoiId)
    .input('ghiChu', sql.NVarChar(255), ghiChu)
    .query(`
      INSERT INTO OrderStatusHistory (OrderId, FromStatus, ToStatus, ChangedBy, Note)
      VALUES (@orderId, @tu, @den, @nguoiDoi, @ghiChu)
    `);
}
 
// Ghi 1 dòng vào lịch sử kho. Gọi SAU KHI đã cập nhật Stock, vì hàm sẽ đọc tồn kho hiện tại
// để lưu vào cột StockAfter. PHẢI gọi bên trong giao dịch.
async function ghiBienDongKho(transaction, volumeId, soLuongDoi, lyDo, orderId, nguoiTaoId, ghiChu = null) {
  await new sql.Request(transaction)
    .input('volumeId', sql.Int, volumeId)
    .input('soLuongDoi', sql.Int, soLuongDoi)
    .input('lyDo', sql.VarChar(20), lyDo)
    .input('orderId', sql.Int, orderId)
    .input('nguoiTao', sql.Int, nguoiTaoId)
    .input('ghiChu', sql.NVarChar(255), ghiChu)
    .query(`
      INSERT INTO StockMovements (VolumeId, QuantityChange, StockAfter, Reason, OrderId, Note, CreatedBy)
      SELECT VolumeId, @soLuongDoi, Stock, @lyDo, @orderId, @ghiChu, @nguoiTao
      FROM BookVolumes
      WHERE VolumeId = @volumeId
    `);
}
 
// Hủy đơn + cộng trả tồn kho. PHẢI gọi bên trong một giao dịch (transaction).
// userId có giá trị  → khách tự hủy: chỉ hủy được đơn CỦA MÌNH và đang 'pending'
// userId là null     → admin hủy: hủy được đơn 'pending' hoặc 'confirmed'
// nguoiThucHienId    → id người bấm hủy (để ghi vào lịch sử). Khách tự hủy thì lấy luôn userId.
async function huyDonVaHoanKho(transaction, orderId, userId = null, nguoiThucHienId = userId, ghiChu = null) {
  // Khóa dòng đơn hàng để 2 người không thao tác cùng lúc trên 1 đơn
  const r = await new sql.Request(transaction)
    .input('orderId', sql.Int, orderId)
    .input('userId', sql.Int, userId)
    .query(`
      SELECT Status FROM Orders WITH (UPDLOCK, ROWLOCK)
      WHERE OrderId = @orderId AND (@userId IS NULL OR UserId = @userId)
    `);
  if (!r.recordset.length) throw new LoiNghiepVu('Không tìm thấy đơn hàng', 404);
  const hienTai = r.recordset[0].Status;
  const choPhep = userId ? ['pending'] : ['pending', 'confirmed'];
  if (!choPhep.includes(hienTai)) {
    throw new LoiNghiepVu(
      userId
        ? 'Chỉ hủy được đơn đang ở trạng thái chờ xác nhận. Vui lòng liên hệ cửa hàng.'
        : 'Đơn ở trạng thái này không thể hủy'
    );
  }
   if (userId) {
    const tt = await new sql.Request(transaction)
      .input('orderId', sql.Int, orderId)
      .query(`SELECT Status FROM Payments WHERE OrderId = @orderId`);
    if (tt.recordset[0]?.Status === 'paid') {
      throw new LoiNghiepVu(
        'Đơn này đã thanh toán, vui lòng liên hệ cửa hàng để hủy và hoàn tiền'
      );
    }
  }
  await new sql.Request(transaction)
    .input('orderId', sql.Int, orderId)
    .query(`UPDATE Orders SET Status = 'cancelled' WHERE OrderId = @orderId`);
 
  // Cộng trả số quyển của từng tập vào kho
  await new sql.Request(transaction)
    .input('orderId', sql.Int, orderId)
    .query(`
      UPDATE v SET v.Stock = v.Stock + od.Quantity
      FROM BookVolumes v
      JOIN OrderDetails od ON od.VolumeId = v.VolumeId
      WHERE od.OrderId = @orderId
    `);
 
  // Ghi lịch sử kho: mỗi tập trong đơn được cộng trả 1 dòng (+số quyển)
  await new sql.Request(transaction)
    .input('orderId', sql.Int, orderId)
    .input('nguoiTao', sql.Int, nguoiThucHienId)
    .query(`
      INSERT INTO StockMovements (VolumeId, QuantityChange, StockAfter, Reason, OrderId, CreatedBy)
      SELECT od.VolumeId, od.Quantity, v.Stock, 'order_cancel', @orderId, @nguoiTao
      FROM OrderDetails od
      JOIN BookVolumes v ON v.VolumeId = od.VolumeId
      WHERE od.OrderId = @orderId
    `);
 
  // Ghi lịch sử đổi trạng thái đơn
   await ghiLichSuTrangThai(
    transaction, orderId, hienTai, 'cancelled', nguoiThucHienId,
    ghiChu || (userId ? 'Khách tự hủy đơn' : 'Quản trị viên hủy đơn')
  );
 
  // Nếu khách CHƯA trả tiền thì đánh dấu thanh toán là đã hủy.
  // Nếu đã trả rồi thì giữ nguyên 'paid' để cửa hàng nhớ hoàn tiền.
    // Trả lại lượt dùng mã giảm giá (nếu đơn có dùng mã)
  const daDung = await new sql.Request(transaction)
    .input('orderId', sql.Int, orderId)
    .query('DELETE FROM VoucherUsages OUTPUT DELETED.VoucherId WHERE OrderId = @orderId');
  if (daDung.recordset.length) {
    await new sql.Request(transaction)
      .input('voucherId', sql.Int, daDung.recordset[0].VoucherId)
      .query('UPDATE Vouchers SET UsedCount = UsedCount - 1 WHERE VoucherId = @voucherId AND UsedCount > 0');
  }

  const pay = await new sql.Request(transaction)
    .input('orderId', sql.Int, orderId)
    .query(`SELECT Status FROM Payments WHERE OrderId = @orderId`);
  const daThanhToan = pay.recordset[0]?.Status === 'paid';
  if (!daThanhToan) {
    await new sql.Request(transaction)
      .input('orderId', sql.Int, orderId)
      .query(`UPDATE Payments SET Status = 'cancelled' WHERE OrderId = @orderId`);
  } else {
    await new sql.Request(transaction)
      .input('orderId', sql.Int, orderId)
      .query(`
        INSERT INTO Refunds (OrderId, Amount, Reason, Note)
        SELECT OrderId, TotalAmount, 'order_cancel', N'Đơn đã thanh toán bị hủy'
        FROM Orders WHERE OrderId = @orderId
      `);
  }
  return { daThanhToan };
}
 
// Lấy chi tiết 1 đơn (thông tin giao hàng + thanh toán + các tập đã mua).
// userId có giá trị → chỉ lấy nếu đơn là của người đó; null → admin xem được mọi đơn
// (và chỉ khi là admin mới trả thêm "history" = lịch sử đổi trạng thái)
async function layChiTietDon(pool, base, orderId, userId = null) {
  const don = await pool.request()
    .input('orderId', sql.Int, orderId)
    .input('userId', sql.Int, userId)
    .query(`
      SELECT o.OrderId AS id, o.CreatedAt AS createdAt, o.Status AS status,
             o.ReceiverName AS receiverName, o.Phone AS phone,
             o.Address AS address, o.Ward AS ward, o.Province AS province,
             o.Note AS note, o.Subtotal AS subtotal, o.ShippingFee AS shippingFee,
             o.TotalAmount AS total, o.ShippingCarrier AS shippingCarrier,
             o.DiscountAmount AS discountAmount, vc.Code AS voucherCode,
             p.Method AS paymentMethod, p.Status AS paymentStatus, p.PaidAt AS paidAt,
             u.fullName AS customerName, u.email AS customerEmail
      FROM Orders o
      LEFT JOIN Payments p ON p.OrderId = o.OrderId
      LEFT JOIN Users u    ON u.id = o.UserId
      LEFT JOIN Vouchers vc ON vc.VoucherId = o.VoucherId
      WHERE o.OrderId = @orderId AND (@userId IS NULL OR o.UserId = @userId)
    `);
  if (!don.recordset.length) return null;
  const items = await pool.request()
    .input('orderId', sql.Int, orderId)
    .query(`
      SELECT od.VolumeId AS volumeId, od.Quantity AS quantity, od.UnitPrice AS unitPrice,
             v.VolumeNo AS volumeNo, b.BookId AS bookId, b.Title AS title,
             v.ImageUrl AS volumeImage, b.ImageUrl AS bookImage
      FROM OrderDetails od
      JOIN BookVolumes v ON v.VolumeId = od.VolumeId
      JOIN Books b       ON b.BookId   = v.BookId
      WHERE od.OrderId = @orderId
      ORDER BY od.VolumeId
    `);
 
  let history;
  if (userId === null) {
    const h = await pool.request()
      .input('orderId', sql.Int, orderId)
      .query(`
        SELECT h.FromStatus AS fromStatus, h.ToStatus AS toStatus, h.ChangedAt AS changedAt,
               h.Note AS note, u.fullName AS changedByName, u.Role AS changedByRole
        FROM OrderStatusHistory h
        LEFT JOIN Users u ON u.id = h.ChangedBy
        WHERE h.OrderId = @orderId
        ORDER BY h.HistoryId
      `);
    history = h.recordset;
  }
 
  return {
    ...don.recordset[0],
    ...(history ? { history } : {}),
    items: items.recordset.map(({ volumeImage, bookImage, ...r }) => {
      const path = volumeImage || bookImage;
      return { ...r, image: path ? base + path : null };
    }),
  };
}
 
module.exports = {
  LoiNghiepVu, xuLyLoi, huyDonVaHoanKho, layChiTietDon,
  ghiLichSuTrangThai, ghiBienDongKho,
};
 