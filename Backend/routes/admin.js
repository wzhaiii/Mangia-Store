const express = require('express');
const { sql, poolPromise } = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const {
  LoiNghiepVu, xuLyLoi, huyDonVaHoanKho, layChiTietDon, ghiLichSuTrangThai,
} = require('../utils/orderService');

const router = express.Router();
router.use(verifyToken);   // 1) phải đăng nhập
router.use(requireAdmin);  // 2) phải là admin

const TRANG_THAI = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];

// Từ trạng thái nào được chuyển sang trạng thái nào
const CHUYEN_TIEP = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping:  ['delivered'],
  delivered: [],
  cancelled: [],
};

// ─── GET /api/admin/summary → số đơn theo từng trạng thái + doanh thu
router.get('/summary', async (req, res) => {
  try {
    const pool = await poolPromise;
    const dem = await pool.request().query(
      `SELECT Status AS status, COUNT(*) AS soDon FROM Orders GROUP BY Status`
    );
    const dt = await pool.request().query(
      `SELECT ISNULL(SUM(TotalAmount), 0) AS doanhThu FROM Orders WHERE Status = 'delivered'`
    );
    const counts = {};
    TRANG_THAI.forEach((s) => (counts[s] = 0));
    dem.recordset.forEach((r) => (counts[r.status] = r.soDon));
    res.json({ counts, revenue: dt.recordset[0].doanhThu });
  } catch (err) {
    xuLyLoi(err, res);
  }
});

// ─── GET /api/admin/orders?status=pending&search=an&page=1&limit=10
router.get('/orders', async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;
    const status = TRANG_THAI.includes(req.query.status) ? req.query.status : null;
    const search = (req.query.search || '').trim();
    const pool = await poolPromise;
    const result = await pool.request()
      .input('status', sql.VarChar(20), status)
      .input('search', sql.NVarChar(100), search ? `%${search}%` : null)
      .input('offset', sql.Int, offset)
      .input('limit',  sql.Int, limit)
      .query(`
        SELECT o.OrderId AS id, o.CreatedAt AS createdAt,
               o.ReceiverName AS receiverName, o.Phone AS phone,
               o.TotalAmount AS total, o.Status AS status,
               p.Method AS paymentMethod, p.Status AS paymentStatus,
               COUNT(*) OVER() AS totalCount
        FROM Orders o
        LEFT JOIN Payments p ON p.OrderId = o.OrderId
        WHERE (@status IS NULL OR o.Status = @status)
          AND (@search IS NULL
               OR o.ReceiverName LIKE @search
               OR o.Phone LIKE @search
               OR CAST(o.OrderId AS NVARCHAR(20)) LIKE @search)
        ORDER BY o.OrderId DESC
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

// ─── GET /api/admin/orders/:id → chi tiết 1 đơn bất kỳ
router.get('/orders/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    if (!orderId) return res.status(400).json({ message: 'Mã đơn không hợp lệ' });
    const base = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const pool = await poolPromise;
    const don = await layChiTietDon(pool, base, orderId, null);
    if (!don) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    res.json(don);
  } catch (err) {
    xuLyLoi(err, res);
  }
});

// ─── PUT /api/admin/orders/:id/status → đổi trạng thái đơn (body: { status })
router.put('/orders/:id/status', async (req, res) => {
  const orderId = parseInt(req.params.id);
  const moi = req.body.status;
  if (!orderId || !TRANG_THAI.includes(moi)) {
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
  }
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    let thongBao = 'Đã cập nhật trạng thái đơn hàng';
    if (moi === 'cancelled') {
      // Hủy thì dùng hàm chung để cộng trả kho
      const { daThanhToan } = await huyDonVaHoanKho(transaction, orderId, null, req.user.id);
      if (daThanhToan) thongBao = 'Đã hủy đơn. Đơn này khách đã thanh toán, hệ thống đã tạo yêu cầu hoàn tiền ở trang "Đổi trả & hoàn tiền"';
    } else {
      // Khóa đơn rồi đọc trạng thái hiện tại + cách thanh toán
      const r = await new sql.Request(transaction)
        .input('orderId', sql.Int, orderId)
        .query(`
          SELECT o.Status, p.Method, p.Status AS PayStatus
          FROM Orders o WITH (UPDLOCK, ROWLOCK)
          LEFT JOIN Payments p ON p.OrderId = o.OrderId
          WHERE o.OrderId = @orderId
        `);
      if (!r.recordset.length) throw new LoiNghiepVu('Không tìm thấy đơn hàng', 404);
      const { Status: hienTai, Method, PayStatus } = r.recordset[0];

      if (!CHUYEN_TIEP[hienTai].includes(moi)) {
        throw new LoiNghiepVu('Không thể chuyển đơn sang trạng thái này');
      }
      // Đơn chuyển khoản phải nhận được tiền rồi mới được giao
      if (moi === 'shipping' && Method === 'BANK' && PayStatus !== 'paid') {
        throw new LoiNghiepVu('Đơn chuyển khoản cần xác nhận đã nhận tiền trước khi giao hàng');
      }

      await new sql.Request(transaction)
        .input('orderId', sql.Int, orderId)
        .input('status', sql.VarChar(20), moi)
        .query(`UPDATE Orders SET Status = @status WHERE OrderId = @orderId`);
      await ghiLichSuTrangThai(transaction, orderId, hienTai, moi, req.user.id);
      // Giao thành công đơn COD = shipper đã thu tiền → ghi nhận đã thanh toán
      if (moi === 'delivered') {
        await new sql.Request(transaction)
          .input('orderId', sql.Int, orderId)
          .query(`
            UPDATE Payments SET Status = 'paid', PaidAt = SYSDATETIME()
            WHERE OrderId = @orderId AND Method = 'COD' AND Status = 'pending'
          `);
      }
    }

    await transaction.commit();
    res.json({ message: thongBao });
  } catch (err) {
    try { await transaction.rollback(); } catch {}
    xuLyLoi(err, res);
  }
});

// ─── PUT /api/admin/orders/:id/payment-paid → xác nhận ĐÃ NHẬN TIỀN chuyển khoản
router.put('/orders/:id/payment-paid', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    if (!orderId) return res.status(400).json({ message: 'Mã đơn không hợp lệ' });
    const pool = await poolPromise;
    const result = await pool.request()
      .input('orderId', sql.Int, orderId)
      .query(`
        UPDATE p SET p.Status = 'paid', p.PaidAt = SYSDATETIME()
        FROM Payments p
        JOIN Orders o ON o.OrderId = p.OrderId
        WHERE p.OrderId = @orderId AND p.Method = 'BANK'
          AND p.Status = 'pending' AND o.Status <> 'cancelled'
      `);
    if (!result.rowsAffected[0]) {
      return res.status(400).json({ message: 'Không thể xác nhận thanh toán cho đơn này' });
    }
    res.json({ message: 'Đã xác nhận nhận tiền' });
  } catch (err) {
    xuLyLoi(err, res);
  }
});
// Các chức năng quản trị khác (đã được bảo vệ bởi 2 dòng router.use phía trên)
router.use(require('./adminCatalog'));  // thể loại, truyện, tập
router.use(require('./adminStock'));    // kho
router.use(require('./adminUser'));    // người dùng
router.use(require('./adminReport'));  // báo cáo
router.use(require('./adminReview'));
router.use(require('./adminVoucher'));  // mã giảm giá
router.use(require('./adminReturn'));   // đổi trả + hoàn tiền
module.exports = router;