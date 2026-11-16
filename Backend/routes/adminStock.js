const express = require('express');
const { sql, poolPromise } = require('../config/database');
const { LoiNghiepVu, xuLyLoi, ghiBienDongKho } = require('../utils/orderService');
 
// Được gắn vào admin.js nên đã kiểm tra đăng nhập + quyền admin
const router = express.Router();
 
const NGUONG_SAP_HET = 5; // tập có tồn kho <= 5 được coi là "sắp hết"
 
// ─── GET /api/admin/stock/volumes?search=&low=1&page=1&limit=15 → tồn kho từng tập
router.get('/stock/volumes', async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit) || 15, 100);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const chiSapHet = req.query.low === '1' ? 1 : 0;
 
    const pool = await poolPromise;
    const result = await pool.request()
      .input('search', sql.NVarChar(255), search ? `%${search}%` : null)
      .input('low', sql.Bit, chiSapHet)
      .input('nguong', sql.Int, NGUONG_SAP_HET)
      .input('offset', sql.Int, offset)
      .input('limit',  sql.Int, limit)
      .query(`
        SELECT v.VolumeId AS volumeId, b.Title AS title, v.VolumeNo AS volumeNo,
               v.Stock AS stock, v.IsActive AS isActive,
               COUNT(*) OVER() AS totalCount
        FROM BookVolumes v
        JOIN Books b ON b.BookId = v.BookId
        WHERE (@search IS NULL OR b.Title LIKE @search)
          AND (@low = 0 OR v.Stock <= @nguong)
        ORDER BY b.Title, v.VolumeNo
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    const rows  = result.recordset;
    const total = rows[0]?.totalCount || 0;
    res.json({
      data: rows.map(({ totalCount, ...r }) => r),
      page, limit, total,
      totalPages: Math.ceil(total / limit),
      nguongSapHet: NGUONG_SAP_HET,
    });
  } catch (err) {
    xuLyLoi(err, res);
  }
});
 
// ─── GET /api/admin/stock/movements?volumeId=&page=1&limit=15 → lịch sử kho (mới nhất trước)
router.get('/stock/movements', async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit) || 15, 100);
    const offset = (page - 1) * limit;
    const volumeId = parseInt(req.query.volumeId) || null;
 
    const pool = await poolPromise;
    const result = await pool.request()
      .input('volumeId', sql.Int, volumeId)
      .input('offset', sql.Int, offset)
      .input('limit',  sql.Int, limit)
      .query(`
        SELECT m.MovementId AS id, m.CreatedAt AS createdAt,
               b.Title AS title, v.VolumeNo AS volumeNo,
               m.QuantityChange AS quantityChange, m.StockAfter AS stockAfter,
               m.Reason AS reason, m.OrderId AS orderId, m.Note AS note,
               u.fullName AS createdByName,
               COUNT(*) OVER() AS totalCount
        FROM StockMovements m
        JOIN BookVolumes v ON v.VolumeId = m.VolumeId
        JOIN Books b       ON b.BookId   = v.BookId
        LEFT JOIN Users u  ON u.id       = m.CreatedBy
        WHERE (@volumeId IS NULL OR m.VolumeId = @volumeId)
        ORDER BY m.MovementId DESC
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
 
// ─── POST /api/admin/stock/adjust → nhập kho / ghi hao hụt / điều chỉnh kiểm kê
// body: { volumeId, change (số nguyên, có thể âm), reason: 'import'|'damaged'|'adjust', note }
router.post('/stock/adjust', async (req, res) => {
  const volumeId = parseInt(req.body.volumeId);
  const change = Number(req.body.change);
  const reason = req.body.reason;
  const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';
 
  try {
    if (!volumeId) throw new LoiNghiepVu('Mã tập không hợp lệ');
    if (!Number.isInteger(change) || change === 0) throw new LoiNghiepVu('Số lượng phải là số nguyên khác 0');
    if (!['import', 'damaged', 'adjust'].includes(reason)) throw new LoiNghiepVu('Lý do không hợp lệ');
    if (reason === 'import' && change < 0) throw new LoiNghiepVu('Nhập kho phải là số dương');
    if (reason === 'damaged' && change > 0) throw new LoiNghiepVu('Hao hụt phải là số âm');
    if (reason !== 'import' && !note) throw new LoiNghiepVu('Vui lòng ghi chú lý do điều chỉnh/hao hụt');
    if (note.length > 255) throw new LoiNghiepVu('Ghi chú tối đa 255 ký tự');
  } catch (err) {
    return xuLyLoi(err, res);
  }
 
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    // Khóa dòng tồn kho để 2 người không sửa cùng lúc
    const r = await new sql.Request(transaction)
      .input('volumeId', sql.Int, volumeId)
      .query('SELECT Stock FROM BookVolumes WITH (UPDLOCK, ROWLOCK) WHERE VolumeId = @volumeId');
    if (!r.recordset.length) throw new LoiNghiepVu('Không tìm thấy tập truyện', 404);
 
    const tonCu = r.recordset[0].Stock;
    const tonMoi = tonCu + change;
    if (tonMoi < 0) {
      throw new LoiNghiepVu(`Kho chỉ còn ${tonCu} quyển, không thể giảm ${-change} quyển`);
    }
    await new sql.Request(transaction)
      .input('volumeId', sql.Int, volumeId)
      .input('tonMoi', sql.Int, tonMoi)
      .query('UPDATE BookVolumes SET Stock = @tonMoi WHERE VolumeId = @volumeId');
 
    await ghiBienDongKho(transaction, volumeId, change, reason, null, req.user.id, note || null);
 
    await transaction.commit();
    res.json({ message: `Đã cập nhật kho: ${tonCu} → ${tonMoi} quyển`, stock: tonMoi });
  } catch (err) {
    try { await transaction.rollback(); } catch {}
    xuLyLoi(err, res);
  }
});
 
module.exports = router;
 