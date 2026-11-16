const express = require('express');
const { sql, poolPromise } = require('../config/database');
const { LoiNghiepVu, xuLyLoi, ghiBienDongKho } = require('../utils/orderService');

// Được gắn vào admin.js nên đã kiểm tra đăng nhập + quyền admin
const router = express.Router();

const TRANG_THAI = ['requested', 'approved', 'rejected', 'completed', 'cancelled'];

// ─── GET /api/admin/returns?status=&page=1&limit=10
router.get('/returns', async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;
    const status = TRANG_THAI.includes(req.query.status) ? req.query.status : null;
    const pool = await poolPromise;
    const r = await pool.request()
      .input('status', sql.VarChar(20), status)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT rr.ReturnId AS id, rr.OrderId AS orderId, rr.Type AS type, rr.Status AS status,
               rr.Reason AS reason, rr.RefundInfo AS refundInfo, rr.AdminNote AS adminNote,
               rr.CreatedAt AS createdAt, u.fullName AS customerName, u.email AS customerEmail,
               (SELECT STRING_AGG(CONCAT(b.Title, N' - Tập ', v.VolumeNo, N' × ', ri.Quantity), N'; ')
                FROM ReturnItems ri
                JOIN BookVolumes v ON v.VolumeId = ri.VolumeId
                JOIN Books b ON b.BookId = v.BookId
                WHERE ri.ReturnId = rr.ReturnId) AS tomTat,
               COUNT(*) OVER() AS totalCount
        FROM ReturnRequests rr
        JOIN Users u ON u.id = rr.UserId
        WHERE (@status IS NULL OR rr.Status = @status)
        ORDER BY rr.ReturnId DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    const rows = r.recordset;
    const total = rows[0]?.totalCount || 0;
    res.json({
      data: rows.map(({ totalCount, ...x }) => x),
      page, limit, total, totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    xuLyLoi(err, res);
  }
});

// Chuyển trạng thái yêu cầu (duyệt / từ chối). "tu" là danh sách trạng thái cho phép chuyển đi
async function chuyen(req, res, tu, den, batBuocGhiChu, thongBao) {
  try {
    const id = parseInt(req.params.id);
    const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';
    if (!id) throw new LoiNghiepVu('Mã yêu cầu không hợp lệ');
    if (batBuocGhiChu && !note) throw new LoiNghiepVu('Vui lòng ghi rõ lý do');
    if (note.length > 500) throw new LoiNghiepVu('Ghi chú tối đa 500 ký tự');
    const pool = await poolPromise;
    const r = await pool.request()
      .input('id', sql.Int, id)
      .input('den', sql.VarChar(20), den)
      .input('note', sql.NVarChar(500), note || null)
      .query(`
        UPDATE ReturnRequests
        SET Status = @den, AdminNote = ISNULL(@note, AdminNote), UpdatedAt = SYSDATETIME()
        WHERE ReturnId = @id AND Status IN (${tu.map((s) => `'${s}'`).join(',')})
      `);
    if (!r.rowsAffected[0]) throw new LoiNghiepVu('Yêu cầu không ở trạng thái phù hợp để thực hiện thao tác này');
    res.json({ message: thongBao });
  } catch (err) {
    xuLyLoi(err, res);
  }
}

router.put('/returns/:id/approve', (req, res) =>
  chuyen(req, res, ['requested'], 'approved', false, 'Đã duyệt. Khách sẽ gửi hàng về cho cửa hàng'));
router.put('/returns/:id/reject', (req, res) =>
  chuyen(req, res, ['requested', 'approved'], 'rejected', true, 'Đã từ chối yêu cầu'));

// Cộng/trừ tồn kho 1 tập rồi ghi lịch sử kho. PHẢI gọi trong giao dịch
async function doiKho(transaction, volumeId, soLuongDoi, lyDo, orderId, nguoiId, ghiChu) {
  const r = await new sql.Request(transaction)
    .input('v', sql.Int, volumeId)
    .query('SELECT Stock FROM BookVolumes WITH (UPDLOCK, ROWLOCK) WHERE VolumeId = @v');
  const tonMoi = r.recordset[0].Stock + soLuongDoi;
  if (tonMoi < 0) {
    throw new LoiNghiepVu('Kho không đủ số quyển để gửi hàng đổi cho khách. Hãy nhập kho thêm rồi thử lại');
  }
  await new sql.Request(transaction)
    .input('v', sql.Int, volumeId)
    .input('ton', sql.Int, tonMoi)
    .query('UPDATE BookVolumes SET Stock = @ton WHERE VolumeId = @v');
  await ghiBienDongKho(transaction, volumeId, soLuongDoi, lyDo, orderId, nguoiId, ghiChu);
}

// ─── PUT /api/admin/returns/:id/complete → ĐÃ NHẬN HÀNG TRẢ VỀ
// body: { restock: true|false, note }
//   restock = true  → hàng còn tốt, nhập lại kho
//   restock = false → hàng hỏng, không nhập lại kho
// Loại "refund": tạo bản ghi hoàn tiền. Loại "exchange": trừ kho 1 cuốn mới để gửi đổi
router.put('/returns/:id/complete', async (req, res) => {
  const id = parseInt(req.params.id);
  const restock = req.body.restock;
  const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';
  try {
    if (!id) throw new LoiNghiepVu('Mã yêu cầu không hợp lệ');
    if (typeof restock !== 'boolean') throw new LoiNghiepVu('Vui lòng chọn tình trạng hàng trả về');
    if (note.length > 500) throw new LoiNghiepVu('Ghi chú tối đa 500 ký tự');
  } catch (err) {
    return xuLyLoi(err, res);
  }

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const tao = () => new sql.Request(transaction);

    const rr = await tao().input('id', sql.Int, id).query(
      'SELECT OrderId, Type, Status FROM ReturnRequests WITH (UPDLOCK, ROWLOCK) WHERE ReturnId = @id'
    );
    if (!rr.recordset.length) throw new LoiNghiepVu('Không tìm thấy yêu cầu', 404);
    const { OrderId, Type, Status } = rr.recordset[0];
    if (Status !== 'approved') throw new LoiNghiepVu('Chỉ hoàn tất được yêu cầu đã duyệt');

    const ds = await tao().input('id', sql.Int, id).query(`
      SELECT ri.VolumeId, ri.Quantity, od.UnitPrice
      FROM ReturnItems ri
      JOIN ReturnRequests r ON r.ReturnId = ri.ReturnId
      JOIN OrderDetails od ON od.OrderId = r.OrderId AND od.VolumeId = ri.VolumeId
      WHERE ri.ReturnId = @id
    `);

    for (const it of ds.recordset) {
      if (restock) {
        await doiKho(transaction, it.VolumeId, it.Quantity, 'return', OrderId, req.user.id,
          `Nhập lại kho do trả hàng #${id}`);
      }
      if (Type === 'exchange') {
        await doiKho(transaction, it.VolumeId, -it.Quantity, 'exchange', OrderId, req.user.id,
          `Xuất hàng đổi cho yêu cầu #${id}`);
      }
    }

    let thongBao = 'Đã hoàn tất yêu cầu đổi hàng. Hãy gửi cuốn mới cho khách';
    if (Type === 'refund') {
      // Số tiền hoàn = giá các quyển trả, trừ phần mã giảm giá chia theo tỷ lệ. Phí ship không hoàn
      const o = await tao().input('orderId', sql.Int, OrderId)
        .query('SELECT Subtotal, DiscountAmount FROM Orders WHERE OrderId = @orderId');
      const { Subtotal, DiscountAmount } = o.recordset[0];
      const tiLe = Subtotal > 0 ? (Subtotal - DiscountAmount) / Subtotal : 1;
      const soTien = Math.round(
        ds.recordset.reduce((tong, it) => tong + it.UnitPrice * it.Quantity * tiLe, 0)
      );
      await tao()
        .input('orderId', sql.Int, OrderId)
        .input('returnId', sql.Int, id)
        .input('amount', sql.Decimal(18, 0), soTien)
        .input('note', sql.NVarChar(255), `Hoàn tiền trả hàng #${id}`)
        .query(`
          INSERT INTO Refunds (OrderId, ReturnId, Amount, Reason, Note)
          VALUES (@orderId, @returnId, @amount, 'return', @note)
        `);
      thongBao = `Đã hoàn tất. Hãy chuyển khoản hoàn ${soTien.toLocaleString('vi-VN')} VNĐ cho khách rồi bấm "Đã hoàn tiền" ở tab Hoàn tiền`;
    }

    await tao()
      .input('id', sql.Int, id)
      .input('restock', sql.Bit, restock ? 1 : 0)
      .input('note', sql.NVarChar(500), note || null)
      .query(`
        UPDATE ReturnRequests
        SET Status = 'completed', Restocked = @restock,
            AdminNote = ISNULL(@note, AdminNote), UpdatedAt = SYSDATETIME()
        WHERE ReturnId = @id
      `);

    await transaction.commit();
    res.json({ message: thongBao });
  } catch (err) {
    try { await transaction.rollback(); } catch {}
    xuLyLoi(err, res);
  }
});

// ─── GET /api/admin/refunds?status=pending|completed&page=1&limit=10
router.get('/refunds', async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;
    const status = ['pending', 'completed'].includes(req.query.status) ? req.query.status : null;
    const pool = await poolPromise;
    const r = await pool.request()
      .input('status', sql.VarChar(20), status)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT f.RefundId AS id, f.OrderId AS orderId, f.ReturnId AS returnId, f.Amount AS amount,
               f.Reason AS reason, f.Status AS status, f.Note AS note,
               f.CreatedAt AS createdAt, f.CompletedAt AS completedAt,
               u.fullName AS customerName, u.email AS customerEmail, rr.RefundInfo AS refundInfo,
               COUNT(*) OVER() AS totalCount
        FROM Refunds f
        JOIN Orders o ON o.OrderId = f.OrderId
        JOIN Users u ON u.id = o.UserId
        LEFT JOIN ReturnRequests rr ON rr.ReturnId = f.ReturnId
        WHERE (@status IS NULL OR f.Status = @status)
        ORDER BY f.RefundId DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    const rows = r.recordset;
    const total = rows[0]?.totalCount || 0;
    res.json({
      data: rows.map(({ totalCount, ...x }) => x),
      page, limit, total, totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    xuLyLoi(err, res);
  }
});

// ─── PUT /api/admin/refunds/:id/complete → đã chuyển tiền hoàn cho khách (body: { note })
router.put('/refunds/:id/complete', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';
    if (!id) throw new LoiNghiepVu('Mã hoàn tiền không hợp lệ');
    if (note.length > 255) throw new LoiNghiepVu('Ghi chú tối đa 255 ký tự');
    const pool = await poolPromise;
    const r = await pool.request()
      .input('id', sql.Int, id)
      .input('admin', sql.Int, req.user.id)
      .input('note', sql.NVarChar(255), note || null)
      .query(`
        UPDATE Refunds
        SET Status = 'completed', CompletedAt = SYSDATETIME(), CompletedBy = @admin,
            Note = ISNULL(@note, Note)
        WHERE RefundId = @id AND Status = 'pending'
      `);
    if (!r.rowsAffected[0]) throw new LoiNghiepVu('Khoản hoàn tiền này đã được xử lý hoặc không tồn tại');
    res.json({ message: 'Đã ghi nhận hoàn tiền cho khách' });
  } catch (err) {
    xuLyLoi(err, res);
  }
});

module.exports = router;