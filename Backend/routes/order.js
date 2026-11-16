const express = require('express');
const { sql, poolPromise } = require('../config/database');
const { verifyToken } = require('../middleware/authMiddleware');
const { kiemTraVoucher } = require('../utils/voucherService');
const router = express.Router();
router.use(verifyToken); 
const CARRIERS = {
  GHN:  { name: 'Giao Hàng Nhanh',     fee: 30000 },
  GHTK: { name: 'Giao Hàng Tiết Kiệm', fee: 28000 },
};
const MIEN_PHI_TU = 300000;
const tinhPhiShip = (carrier, subtotal) =>
  subtotal >= MIEN_PHI_TU ? 0 : CARRIERS[carrier].fee;
const { LoiNghiepVu, xuLyLoi, huyDonVaHoanKho, layChiTietDon, ghiLichSuTrangThai, ghiBienDongKho, } = require('../utils/orderService');
router.get('/shipping-options', (req, res) => {
  const subtotal = Number(req.query.subtotal) || 0;
  const options = Object.entries(CARRIERS).map(([carrier, info]) => ({
    carrier,
    name: info.name,
    fee: tinhPhiShip(carrier, subtotal),
  }));
  res.json(options);
});
router.post('/', async (req, res) => {
  const {
    receiverName, phone, address, ward, province,
    note, paymentMethod, shippingCarrier, voucherCode
  } = req.body;
  
  if (!receiverName || !phone || !address || !province) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin giao hàng' });
  }
  if (!/^0\d{9}$/.test(phone)) {
    return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
  }
  if (!['COD', 'BANK'].includes(paymentMethod)) {
    return res.status(400).json({ message: 'Phương thức thanh toán không hợp lệ' });
  }
  if (!CARRIERS[shippingCarrier]) {
    return res.status(400).json({ message: 'Hãng vận chuyển không hợp lệ' });
  }
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin(); // bắt đầu giao dịch
    // 2. Đọc giỏ hàng. UPDLOCK khóa các dòng tồn kho, để 2 người mua cùng
    //    lúc 1 tập còn 1 quyển thì không bị bán trùng
    const cart = await new sql.Request(transaction)
      .input('userId', sql.Int, req.user.id)
      .query(`
        SELECT ci.VolumeId, ci.Quantity, v.Stock, b.Price, v.IsActive AS VolActive, b.IsActive AS BookActive
        FROM Carts c
        JOIN CartItems ci ON ci.CartId  = c.CartId
        JOIN BookVolumes v WITH (UPDLOCK, ROWLOCK) ON v.VolumeId = ci.VolumeId
        JOIN Books b ON b.BookId = v.BookId
        WHERE c.UserId = @userId
      `);
    const items = cart.recordset;
    if (items.length === 0) throw new LoiNghiepVu('Giỏ hàng đang trống');
    // 3. Kiểm tra tồn kho và tính tiền hàng bằng giá trong database
    let subtotal = 0;
    for (const it of items) {
       if (!it.VolActive || !it.BookActive) {
       throw new LoiNghiepVu('Có sản phẩm đã ngừng bán, vui lòng xóa khỏi giỏ hàng');
      }
  if (it.Quantity > it.Stock) {
        throw new LoiNghiepVu('Có sản phẩm không đủ số lượng, vui lòng kiểm tra lại giỏ hàng');
      }
      subtotal += it.Quantity * it.Price;
    }
       // Áp mã giảm giá (nếu có). Chạy BÊN TRONG giao dịch nên số lượt dùng được khóa an toàn
    let discount = 0;
    let voucherId = null;
    if (voucherCode && String(voucherCode).trim()) {
      const vc = await kiemTraVoucher(
        () => new sql.Request(transaction), voucherCode, req.user.id, subtotal
      );
      discount = vc.discount;
      voucherId = vc.voucherId;
    }
    const shippingFee = tinhPhiShip(shippingCarrier, subtotal);
    const total = subtotal - discount + shippingFee;
    // 4. Tạo đơn hàng, lấy luôn OrderId vừa sinh ra
        const orderResult = await new sql.Request(transaction)
      .input('userId', sql.Int, req.user.id)
      .input('receiverName', sql.NVarChar(100), receiverName)
      .input('phone', sql.VarChar(15), phone)
      .input('address', sql.NVarChar(255), address)
      .input('ward', sql.NVarChar(100), ward || null)
      .input('province', sql.NVarChar(100), province)
      .input('note', sql.NVarChar(500), note || null)
      .input('subtotal', sql.Decimal(18, 0), subtotal)
      .input('shippingFee', sql.Decimal(18, 0), shippingFee)
      .input('total', sql.Decimal(18, 0), total)
      .input('carrier', sql.VarChar(20), shippingCarrier)
      .input('voucherId', sql.Int, voucherId)          
      .input('discount', sql.Decimal(18, 0), discount) 
      .query(`
        INSERT INTO Orders (UserId, ReceiverName, Phone, Address, Ward, Province,
                            Note, Subtotal, ShippingFee, TotalAmount, ShippingCarrier,
                            VoucherId, DiscountAmount)
        OUTPUT INSERTED.OrderId
        VALUES (@userId, @receiverName, @phone, @address, @ward, @province,
                @note, @subtotal, @shippingFee, @total, @carrier,
                @voucherId, @discount)
      `);
    const orderId = orderResult.recordset[0].OrderId;
    // 5. Với mỗi tập: ghi chi tiết đơn và trừ kho
    for (const it of items) {
      await new sql.Request(transaction)
        .input('orderId', sql.Int, orderId)
        .input('volumeId', sql.Int, it.VolumeId)
        .input('quantity', sql.Int, it.Quantity)
        .input('unitPrice', sql.Decimal(18, 0), it.Price)
        .query(`
          INSERT INTO OrderDetails (OrderId, VolumeId, Quantity, UnitPrice)
          VALUES (@orderId, @volumeId, @quantity, @unitPrice)
        `);
      // Điều kiện "Stock >= @quantity" là lớp bảo vệ cuối cùng chống bán âm kho
      const tru = await new sql.Request(transaction)
        .input('volumeId', sql.Int, it.VolumeId)
        .input('quantity', sql.Int, it.Quantity)
        .query(`
          UPDATE BookVolumes SET Stock = Stock - @quantity
          WHERE VolumeId = @volumeId AND Stock >= @quantity
        `);
      if (!tru.rowsAffected[0]) {
        throw new LoiNghiepVu('Có sản phẩm vừa hết hàng, vui lòng kiểm tra lại giỏ hàng');
      }
      // Ghi lịch sử kho: bán ra nên số lượng đổi là số ÂM
        await ghiBienDongKho(transaction, it.VolumeId, -it.Quantity, 'order', orderId, req.user.id);
    }
    // 6. Ghi thanh toán (cả COD lẫn chuyển khoản đều bắt đầu ở trạng thái 'pending')
    await new sql.Request(transaction)
      .input('orderId', sql.Int, orderId)
      .input('method', sql.VarChar(10), paymentMethod)
      .input('amount', sql.Decimal(18, 0), total)
      .query(`
        INSERT INTO Payments (OrderId, Method, Amount)
        VALUES (@orderId, @method, @amount)
      `);
       if (voucherId) {
      await new sql.Request(transaction)
        .input('voucherId', sql.Int, voucherId)
        .input('userId', sql.Int, req.user.id)
        .input('orderId', sql.Int, orderId)
        .input('discount', sql.Decimal(18, 0), discount)
        .query(`
          INSERT INTO VoucherUsages (VoucherId, UserId, OrderId, DiscountAmount)
          VALUES (@voucherId, @userId, @orderId, @discount);
          UPDATE Vouchers SET UsedCount = UsedCount + 1 WHERE VoucherId = @voucherId;
        `);
    }
// Ghi lịch sử trạng thái: từ null (chưa có) sang 'pending'
    await ghiLichSuTrangThai(transaction, orderId, null, 'pending', req.user.id, 'Khách đặt hàng');
    // 7. Xóa các dòng trong giỏ hàng
    await new sql.Request(transaction)
      .input('userId', sql.Int, req.user.id)
      .query(`
        DELETE ci FROM CartItems ci
        JOIN Carts c ON c.CartId = ci.CartId
        WHERE c.UserId = @userId
      `);

    await transaction.commit(); // chốt giao dịch: mọi thứ được ghi thật vào database
    res.status(201).json({
      message: 'Đặt hàng thành công',
      orderId, subtotal,discount, shippingFee, total, paymentMethod,
    });
  } catch (err) {
    try { await transaction.rollback(); } catch {} // hoàn tác mọi thứ đã làm
    if (err instanceof LoiNghiepVu) {
      return res.status(400).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});
// ─── GET /api/orders → danh sách đơn của chính người đang đăng nhập
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, req.user.id)
      .query(`
        SELECT o.OrderId AS id, o.CreatedAt AS createdAt, o.TotalAmount AS total,
               o.Status AS status, p.Method AS paymentMethod, p.Status AS paymentStatus,
               (SELECT SUM(Quantity) FROM OrderDetails WHERE OrderId = o.OrderId) AS soQuyen
        FROM Orders o
        LEFT JOIN Payments p ON p.OrderId = o.OrderId
        WHERE o.UserId = @userId
        ORDER BY o.OrderId DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    xuLyLoi(err, res);
  }
});

// ─── GET /api/orders/:id → chi tiết 1 đơn (chỉ xem được đơn của mình)
router.get('/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    if (!orderId) return res.status(400).json({ message: 'Mã đơn không hợp lệ' });
    const base = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const pool = await poolPromise;
    const don = await layChiTietDon(pool, base, orderId, req.user.id);
    if (!don) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    res.json(don);
  } catch (err) {
    xuLyLoi(err, res);
  }
});

// ─── PUT /api/orders/:id/cancel → khách tự hủy đơn đang chờ xác nhận
router.put('/:id/cancel', async (req, res) => {
  const orderId = parseInt(req.params.id);
  if (!orderId) return res.status(400).json({ message: 'Mã đơn không hợp lệ' });
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    await huyDonVaHoanKho(transaction, orderId, req.user.id);
    await transaction.commit();
    res.json({ message: 'Đã hủy đơn hàng' });
  } catch (err) {
    try { await transaction.rollback(); } catch {}
    xuLyLoi(err, res);
  }
});
module.exports = router;