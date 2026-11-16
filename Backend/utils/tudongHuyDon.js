const cron = require('node-cron');
const { sql, poolPromise } = require('../config/database');
const { huyDonVaHoanKho } = require('./orderService');

const SO_GIO_CHO = 24; // quá số giờ này mà chưa trả tiền thì hủy

async function quetDonQuaHan() {
  try {
    const pool = await poolPromise;
    // 1. Tìm các đơn chuyển khoản, chưa trả tiền, đã đặt quá 24 giờ
    const ds = await pool.request()
      .input('gio', sql.Int, SO_GIO_CHO)
      .query(`
        SELECT o.OrderId
        FROM Orders o
        JOIN Payments p ON p.OrderId = o.OrderId
        WHERE o.Status IN ('pending', 'confirmed')
          AND p.Method = 'BANK' AND p.Status = 'pending'
          AND o.CreatedAt < DATEADD(HOUR, -@gio, SYSDATETIME())
      `);

    // 2. Hủy từng đơn trong MỘT giao dịch riêng (đơn nào lỗi thì chỉ đơn đó bị hoàn tác)
    for (const { OrderId } of ds.recordset) {
      const transaction = new sql.Transaction(pool);
      try {
        await transaction.begin();
        // Khóa dòng thanh toán rồi kiểm tra lại: lỡ khách vừa trả tiền xong trong lúc đang quét
        const kt = await new sql.Request(transaction)
          .input('orderId', sql.Int, OrderId)
          .query(`SELECT Status FROM Payments WITH (UPDLOCK, ROWLOCK) WHERE OrderId = @orderId`);
        if (kt.recordset[0]?.Status !== 'pending') {
          await transaction.rollback();
          continue;
        }
        // userId = null, người thực hiện = null (không phải người nào cả, là hệ thống)
        await huyDonVaHoanKho(
          transaction, OrderId, null, null,
          `Hệ thống tự hủy: quá ${SO_GIO_CHO} giờ chưa thanh toán`
        );
        await transaction.commit();
        console.log(`Đã tự hủy đơn #${OrderId} (quá hạn thanh toán)`);
      } catch (err) {
        try { await transaction.rollback(); } catch {}
        console.error(`Lỗi tự hủy đơn #${OrderId}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Lỗi quét đơn quá hạn:', err);
  }
}

exports.batDau = () => {
  cron.schedule('*/15 * * * *', quetDonQuaHan); // mỗi 15 phút
  quetDonQuaHan();                              // chạy luôn 1 lần khi máy chủ vừa bật
};