const { sql } = require('../config/database');

const SO_NGAY_DOI_TRA = 7; // phải khớp SO_NGAY_DOI_TRA trong trangthai.js (frontend)

// Lấy thông tin đơn dùng để xét đổi trả: trạng thái, còn trong hạn 7 ngày không...
// "Thời điểm giao" lấy từ lịch sử đổi trạng thái (đơn cũ không có thì lấy ngày đặt)
// khoa = true → khóa dòng đơn (dùng trong giao dịch để 2 yêu cầu gửi cùng lúc không vượt số quyển)
async function layDonDeTra(taoRequest, orderId, userId, khoa = false) {
  const r = await taoRequest()
    .input('orderId', sql.Int, orderId)
    .input('userId', sql.Int, userId)
    .input('ngay', sql.Int, SO_NGAY_DOI_TRA)
    .query(`
      SELECT o.OrderId, o.Status, o.Subtotal, o.DiscountAmount, g.GiaoLuc,
             DATEADD(DAY, @ngay, g.GiaoLuc) AS hanChot,
             CASE WHEN DATEADD(DAY, @ngay, g.GiaoLuc) >= SYSDATETIME() THEN 1 ELSE 0 END AS trongHan
      FROM Orders o ${khoa ? 'WITH (UPDLOCK, ROWLOCK)' : ''}
      CROSS APPLY (
        SELECT ISNULL(
          (SELECT MAX(h.ChangedAt) FROM OrderStatusHistory h
           WHERE h.OrderId = o.OrderId AND h.ToStatus = 'delivered'),
          o.CreatedAt) AS GiaoLuc
      ) g
      WHERE o.OrderId = @orderId AND o.UserId = @userId
    `);
  return r.recordset[0] || null;
}

// Mỗi tập trong đơn: đã mua bao nhiêu, còn được trả tối đa bao nhiêu
// (trừ đi số quyển nằm trong các yêu cầu đang chờ / đã duyệt / đã hoàn tất)
async function laySanPhamCoTheTra(taoRequest, orderId) {
  const r = await taoRequest()
    .input('orderId', sql.Int, orderId)
    .query(`
      SELECT od.VolumeId AS volumeId, od.Quantity AS daMua, od.UnitPrice AS unitPrice,
             v.VolumeNo AS volumeNo, b.Title AS title,
             od.Quantity - ISNULL((
               SELECT SUM(ri.Quantity)
               FROM ReturnItems ri
               JOIN ReturnRequests rr ON rr.ReturnId = ri.ReturnId
               WHERE rr.OrderId = od.OrderId AND ri.VolumeId = od.VolumeId
                 AND rr.Status IN ('requested', 'approved', 'completed')
             ), 0) AS conLai
      FROM OrderDetails od
      JOIN BookVolumes v ON v.VolumeId = od.VolumeId
      JOIN Books b ON b.BookId = v.BookId
      WHERE od.OrderId = @orderId
      ORDER BY od.VolumeId
    `);
  return r.recordset;
}

module.exports = { SO_NGAY_DOI_TRA, layDonDeTra, laySanPhamCoTheTra };