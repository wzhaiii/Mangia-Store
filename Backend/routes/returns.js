const express = require('express');
const { sql, poolPromise } = require('../config/database');
const { verifyToken } = require('../middleware/authMiddleware');
const { LoiNghiepVu, xuLyLoi } = require('../utils/orderService');
const { SO_NGAY_DOI_TRA, layDonDeTra, laySanPhamCoTheTra } = require('../utils/returnService');

const router = express.Router();
router.use(verifyToken);

// ─── GET /api/returns/eligible/:orderId → đơn này có được đổi trả không, được trả những gì
router.get('/eligible/:orderId', async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    if (!orderId) throw new LoiNghiepVu('Mã đơn không hợp lệ');
    const pool = await poolPromise;
    const don = await layDonDeTra(() => pool.request(), orderId, req.user.id);
    if (!don) throw new LoiNghiepVu('Không tìm thấy đơn hàng', 404);
    const items = await laySanPhamCoTheTra(() => pool.request(), orderId);

    let lyDo = null;
    if (don.Status !== 'delivered') lyDo = 'Chỉ đơn đã giao thành công mới được đổi trả';
    else if (!don.trongHan) lyDo = `Đã quá ${SO_NGAY_DOI_TRA} ngày kể từ khi nhận hàng`;
    else if (!items.some((i) => i.conLai > 0)) lyDo = 'Tất cả sản phẩm trong đơn đã có yêu cầu đổi trả';

    res.json({ orderId, choPhep: !lyDo, lyDo, hanChot: don.hanChot, items });
  } catch (err) {
    xuLyLoi(err, res);
  }
});

// ─── POST /api/returns → gửi yêu cầu đổi trả
// body: { orderId, type: 'refund'|'exchange', reason, refundInfo, items: [{ volumeId, quantity }] }
router.post('/', async (req, res) => {
  const orderId = parseInt(req.body.orderId);
  const type = req.body.type;
  const reason = String(req.body.reason || '').trim();
  const refundInfo = String(req.body.refundInfo || '').trim();
  const danhSach = Array.isArray(req.body.items)
    ? req.body.items.map((i) => ({ volumeId: parseInt(i.volumeId), quantity: parseInt(i.quantity) }))
    : [];

  try {
    if (!orderId) throw new LoiNghiepVu('Mã đơn không hợp lệ');
    if (!['refund', 'exchange'].includes(type)) throw new LoiNghiepVu('Loại yêu cầu không hợp lệ');
    if (reason.length < 5) throw new LoiNghiepVu('Vui lòng nhập lý do (ít nhất 5 ký tự)');
    if (reason.length > 500) throw new LoiNghiepVu('Lý do tối đa 500 ký tự');
    if (type === 'refund' && refundInfo.length < 5) {
      throw new LoiNghiepVu('Vui lòng nhập thông tin nhận hoàn tiền (ngân hàng, số tài khoản, tên chủ tài khoản)');
    }
    if (refundInfo.length > 255) throw new LoiNghiepVu('Thông tin nhận hoàn tiền tối đa 255 ký tự');
    if (!danhSach.length) throw new LoiNghiepVu('Vui lòng chọn ít nhất 1 sản phẩm cần đổi trả');
    if (danhSach.some((i) => !i.volumeId || !Number.isInteger(i.quantity) || i.quantity < 1)) {
      throw new LoiNghiepVu('Dữ liệu sản phẩm không hợp lệ');
    }
    if (new Set(danhSach.map((i) => i.volumeId)).size !== danhSach.length) {
      throw new LoiNghiepVu('Mỗi tập chỉ được xuất hiện một lần');
    }
  } catch (err) {
    return xuLyLoi(err, res);
  }

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const tao = () => new sql.Request(transaction);

    // Khóa đơn rồi kiểm tra lại mọi điều kiện (tránh khách bấm gửi 2 lần cùng lúc)
    const don = await layDonDeTra(tao, orderId, req.user.id, true);
    if (!don) throw new LoiNghiepVu('Không tìm thấy đơn hàng', 404);
    if (don.Status !== 'delivered') throw new LoiNghiepVu('Chỉ đơn đã giao thành công mới được đổi trả');
    if (!don.trongHan) throw new LoiNghiepVu(`Đã quá ${SO_NGAY_DOI_TRA} ngày kể từ khi nhận hàng`);

    const conLai = new Map((await laySanPhamCoTheTra(tao, orderId)).map((i) => [i.volumeId, i.conLai]));
    for (const it of danhSach) {
      if (!conLai.has(it.volumeId)) throw new LoiNghiepVu('Có sản phẩm không thuộc đơn hàng này');
      if (it.quantity > conLai.get(it.volumeId)) {
        throw new LoiNghiepVu('Số quyển muốn đổi trả vượt quá số quyển còn được phép');
      }
    }

    const rr = await tao()
      .input('orderId', sql.Int, orderId)
      .input('userId', sql.Int, req.user.id)
      .input('type', sql.VarChar(10), type)
      .input('reason', sql.NVarChar(500), reason)
      .input('refundInfo', sql.NVarChar(255), type === 'refund' ? refundInfo : null)
      .query(`
        INSERT INTO ReturnRequests (OrderId, UserId, Type, Reason, RefundInfo)
        OUTPUT INSERTED.ReturnId
        VALUES (@orderId, @userId, @type, @reason, @refundInfo)
      `);
    const returnId = rr.recordset[0].ReturnId;

    for (const it of danhSach) {
      await tao()
        .input('returnId', sql.Int, returnId)
        .input('volumeId', sql.Int, it.volumeId)
        .input('quantity', sql.Int, it.quantity)
        .query('INSERT INTO ReturnItems (ReturnId, VolumeId, Quantity) VALUES (@returnId, @volumeId, @quantity)');
    }

    await transaction.commit();
    res.status(201).json({ message: 'Đã gửi yêu cầu, vui lòng chờ cửa hàng xét duyệt', id: returnId });
  } catch (err) {
    try { await transaction.rollback(); } catch {}
    xuLyLoi(err, res);
  }
});

// ─── GET /api/returns → các yêu cầu đổi trả của chính mình
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const r = await pool.request()
      .input('userId', sql.Int, req.user.id)
      .query(`
        SELECT rr.ReturnId AS id, rr.OrderId AS orderId, rr.Type AS type, rr.Status AS status,
               rr.Reason AS reason, rr.AdminNote AS adminNote, rr.CreatedAt AS createdAt,
               (SELECT STRING_AGG(CONCAT(b.Title, N' - Tập ', v.VolumeNo, N' × ', ri.Quantity), N'; ')
                FROM ReturnItems ri
                JOIN BookVolumes v ON v.VolumeId = ri.VolumeId
                JOIN Books b ON b.BookId = v.BookId
                WHERE ri.ReturnId = rr.ReturnId) AS tomTat,
               f.Amount AS refundAmount, f.Status AS refundStatus
        FROM ReturnRequests rr
        LEFT JOIN Refunds f ON f.ReturnId = rr.ReturnId
        WHERE rr.UserId = @userId
        ORDER BY rr.ReturnId DESC
      `);
    res.json(r.recordset);
  } catch (err) {
    xuLyLoi(err, res);
  }
});

// ─── PUT /api/returns/:id/cancel → khách tự hủy khi yêu cầu còn "Chờ duyệt"
router.put('/:id/cancel', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) throw new LoiNghiepVu('Mã yêu cầu không hợp lệ');
    const pool = await poolPromise;
    const r = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, req.user.id)
      .query(`
        UPDATE ReturnRequests SET Status = 'cancelled', UpdatedAt = SYSDATETIME()
        WHERE ReturnId = @id AND UserId = @userId AND Status = 'requested'
      `);
    if (!r.rowsAffected[0]) throw new LoiNghiepVu('Chỉ hủy được yêu cầu đang chờ duyệt');
    res.json({ message: 'Đã hủy yêu cầu đổi trả' });
  } catch (err) {
    xuLyLoi(err, res);
  }
});

module.exports = router;