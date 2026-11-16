const express = require('express');
const { sql, poolPromise } = require('../config/database');
const { xuLyLoi } = require('../utils/orderService');
 
// Được gắn vào admin.js nên đã kiểm tra đăng nhập + quyền admin
const router = express.Router();
 
const DANG_NGAY = /^\d{4}-\d{2}-\d{2}$/; // yyyy-mm-dd
 
// ─── GET /api/admin/reports?from=2026-10-01&to=2026-10-31&groupBy=day|month
// Trả về: tổng quan, doanh thu theo ngày/tháng, sách bán chạy, sách bị hủy nhiều
router.get('/reports', async (req, res) => {
  try {
    const homNay = new Date().toISOString().slice(0, 10);
    const ba10NgayTruoc = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
    const den = DANG_NGAY.test(req.query.to || '') ? req.query.to : homNay;
    const tu = DANG_NGAY.test(req.query.from || '') ? req.query.from : ba10NgayTruoc;
    // Danh sách trắng: chỉ cho 'day' hoặc 'month', độ dài chuỗi 10 ('2026-10-27') hoặc 7 ('2026-10')
    const groupBy = req.query.groupBy === 'month' ? 'month' : 'day';
    const doDai = groupBy === 'month' ? 7 : 10;
    const top = Math.min(parseInt(req.query.top) || 10, 50);
 
    const pool = await poolPromise;
    // Mỗi truy vấn cần tạo 1 request riêng, cùng truyền khoảng ngày
    const tao = () => pool.request()
      .input('tu', sql.VarChar(10), tu)
      .input('den', sql.VarChar(10), den)
      .input('top', sql.Int, top);
 
    // Điều kiện lọc ngày: từ 00:00 ngày "tu" đến hết ngày "den"
    const LOC_NGAY = `o.CreatedAt >= CONVERT(DATE, @tu, 23)
                      AND o.CreatedAt < DATEADD(DAY, 1, CONVERT(DATE, @den, 23))`;
 
    const [tongQuan, doanhThu, banChay, biHuy, hoan] = await Promise.all([
      tao().query(`
        SELECT COUNT(*) AS tongDon,
               ISNULL(SUM(CASE WHEN o.Status = 'delivered' THEN 1 ELSE 0 END), 0) AS donDaGiao,
               ISNULL(SUM(CASE WHEN o.Status = 'cancelled' THEN 1 ELSE 0 END), 0) AS donHuy,
               ISNULL(SUM(CASE WHEN o.Status = 'delivered' THEN o.TotalAmount ELSE 0 END), 0) AS doanhThu
        FROM Orders o
        WHERE ${LOC_NGAY}
      `),
      // GROUP BY theo ngày/tháng, SUM tiền của các đơn ĐÃ GIAO
      tao().query(`
        SELECT CONVERT(VARCHAR(${doDai}), o.CreatedAt, 120) AS ky,
               COUNT(*) AS soDon,
               SUM(o.TotalAmount) AS doanhThu
        FROM Orders o
        WHERE o.Status = 'delivered' AND ${LOC_NGAY}
        GROUP BY CONVERT(VARCHAR(${doDai}), o.CreatedAt, 120)
        ORDER BY ky
      `),
      // Sách bán chạy: cộng số quyển của các đơn đã giao, gom theo bộ truyện
      tao().query(`
        SELECT TOP (@top) b.BookId AS bookId, b.Title AS title,
               SUM(od.Quantity) AS soQuyen,
               SUM(od.Quantity * od.UnitPrice) AS doanhThu
        FROM OrderDetails od
        JOIN Orders o       ON o.OrderId  = od.OrderId
        JOIN BookVolumes v  ON v.VolumeId = od.VolumeId
        JOIN Books b        ON b.BookId   = v.BookId
        WHERE o.Status = 'delivered' AND ${LOC_NGAY}
        GROUP BY b.BookId, b.Title
        ORDER BY soQuyen DESC, b.BookId
      `),
      // Sách bị hủy nhiều: cùng cách tính nhưng với đơn đã hủy
      tao().query(`
        SELECT TOP (@top) b.BookId AS bookId, b.Title AS title,
               SUM(od.Quantity) AS soQuyen,
               COUNT(DISTINCT o.OrderId) AS soDon
        FROM OrderDetails od
        JOIN Orders o       ON o.OrderId  = od.OrderId
        JOIN BookVolumes v  ON v.VolumeId = od.VolumeId
        JOIN Books b        ON b.BookId   = v.BookId
        WHERE o.Status = 'cancelled' AND ${LOC_NGAY}
        GROUP BY b.BookId, b.Title
        ORDER BY soQuyen DESC, b.BookId
      `),
       tao().query(`
        SELECT ISNULL(SUM(r.Amount), 0) AS hoanTien
        FROM Refunds r
        JOIN Orders o ON o.OrderId = r.OrderId
        WHERE r.Reason = 'return' AND r.Status = 'completed' AND ${LOC_NGAY}
      `),
    ]);
 
    const t = tongQuan.recordset[0];
    res.json({
      tu, den, groupBy,
      tongQuan: { ...t, hoanTien: hoan.recordset[0].hoanTien, tyLeHuy: t.tongDon ? t.donHuy / t.tongDon : 0 },
      doanhThu: doanhThu.recordset,
      banChay: banChay.recordset,
      biHuy: biHuy.recordset,
    });
  } catch (err) {
    xuLyLoi(err, res);
  }
});
 
module.exports = router;
 