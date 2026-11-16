const express = require('express');
const { sql, poolPromise } = require('../config/database');
const { verifyToken } = require('../middleware/authMiddleware'); 
const router = express.Router();
// Mọi đường dẫn trong file này đều bắt buộc đăng nhập
router.use(verifyToken);
// Đổi '/uploads/books/x.jpg' thành địa chỉ đầy đủ để thẻ <img> tải được
const toFullUrl = (req, path) => {
  if (!path) return null;
  const base = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  return base + path;
};
// Lấy mã giỏ hàng của người dùng; chưa có thì tạo mới
async function getOrCreateCartId(pool, userId) {
  const found = await pool.request()
    .input('userId', sql.Int, userId)
    .query('SELECT CartId FROM Carts WHERE UserId = @userId');
    if (found.recordset.length) return found.recordset[0].CartId;
  const created = await pool.request()
    .input('userId', sql.Int, userId)
    .query('INSERT INTO Carts (UserId) OUTPUT INSERTED.CartId VALUES (@userId)');
  return created.recordset[0].CartId;
}
// ─── GET /api/cart → xem giỏ hàng
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, req.user.id)
      .query(`
        SELECT ci.VolumeId AS volumeId,
               ci.Quantity AS quantity,
               v.VolumeNo  AS volumeNo,
               v.Stock     AS stock,
               v.ImageUrl  AS volumeImage,
               b.BookId    AS bookId,
               b.Title     AS title,
               b.Price     AS price,
               b.ImageUrl  AS bookImage
        FROM Carts c
        JOIN CartItems ci  ON ci.CartId   = c.CartId
        JOIN BookVolumes v ON v.VolumeId  = ci.VolumeId
        JOIN Books b       ON b.BookId    = v.BookId
        WHERE c.UserId = @userId
        ORDER BY ci.CartItemId
      `);
    const items = result.recordset.map(({ volumeImage, bookImage, ...r }) => ({
      ...r,
      image: toFullUrl(req, volumeImage || bookImage), // ưu tiên ảnh bìa của tập
    }));
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});
// ─── POST /api/cart → thêm 1 tập vào giỏ (body: { volumeId, quantity })
router.post('/', async (req, res) => {
  try {
    const volumeId = parseInt(req.body.volumeId);
    const quantity = parseInt(req.body.quantity);
    if (!volumeId || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }
    const pool = await poolPromise;
    // 1. Tập này có tồn tại không, còn bao nhiêu quyển?
    const vol = await pool.request()
      .input('volumeId', sql.Int, volumeId)
      .query(` SELECT v.Stock FROM BookVolumes v JOIN Books b ON b.BookId = v.BookId JOIN Categories c ON c.CategoryId = b.CategoryId
               WHERE v.VolumeId = @volumeId AND v.IsActive = 1 AND b.IsActive = 1 AND c.IsActive = 1
`);
    if (!vol.recordset.length) {
      return res.status(404).json({ message: 'Không tìm thấy tập truyện' });
    }
    const stock = vol.recordset[0].Stock;
    // 2. Trong giỏ đã có tập này chưa, đang có mấy quyển?
    const cartId = await getOrCreateCartId(pool, req.user.id);
    const existing = await pool.request()
      .input('cartId', sql.Int, cartId)
      .input('volumeId', sql.Int, volumeId)
      .query('SELECT Quantity FROM CartItems WHERE CartId = @cartId AND VolumeId = @volumeId');
    const daCo = existing.recordset.length ? existing.recordset[0].Quantity : 0;
    // 3. Tổng sau khi thêm không được vượt tồn kho
    if (daCo + quantity > stock) {
      const conThem = Math.max(stock - daCo, 0);
      return res.status(400).json({
        message: conThem === 0
          ? `Bạn đã có ${daCo} quyển trong giỏ, đã hết số lượng có thể thêm`
          : `Chỉ còn ${stock} quyển, bạn đã có ${daCo} trong giỏ, chỉ thêm được tối đa ${conThem} quyển nữa`,
      });
    }
    // 4. Có rồi thì cộng dồn, chưa có thì thêm dòng mới
    if (existing.recordset.length) {
      await pool.request()
        .input('cartId', sql.Int, cartId)
        .input('volumeId', sql.Int, volumeId)
        .input('quantity', sql.Int, daCo + quantity)
        .query('UPDATE CartItems SET Quantity = @quantity WHERE CartId = @cartId AND VolumeId = @volumeId');
    } else {
      await pool.request()
        .input('cartId', sql.Int, cartId)
        .input('volumeId', sql.Int, volumeId)
        .input('quantity', sql.Int, quantity)
        .query('INSERT INTO CartItems (CartId, VolumeId, Quantity) VALUES (@cartId, @volumeId, @quantity)');
    }
    res.status(201).json({ message: 'Đã thêm vào giỏ hàng' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});
// ─── PUT /api/cart/:volumeId → đổi số lượng (body: { quantity })
router.put('/:volumeId', async (req, res) => {
  try {
    const volumeId = parseInt(req.params.volumeId);
    const quantity = parseInt(req.body.quantity);
    if (!volumeId || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }
    const pool = await poolPromise;
    const vol = await pool.request()
      .input('volumeId', sql.Int, volumeId)
      .query('SELECT Stock FROM BookVolumes WHERE VolumeId = @volumeId');
    if (!vol.recordset.length) {
      return res.status(404).json({ message: 'Không tìm thấy tập truyện' });
    }
    if (quantity > vol.recordset[0].Stock) {
      return res.status(400).json({ message: `Chỉ còn ${vol.recordset[0].Stock} quyển` });
    }
    const cartId = await getOrCreateCartId(pool, req.user.id);
    const result = await pool.request()
      .input('cartId', sql.Int, cartId)
      .input('volumeId', sql.Int, volumeId)
      .input('quantity', sql.Int, quantity)
      .query('UPDATE CartItems SET Quantity = @quantity WHERE CartId = @cartId AND VolumeId = @volumeId');
    if (!result.rowsAffected[0]) {
      return res.status(404).json({ message: 'Sản phẩm không có trong giỏ' });
    }
    res.json({ message: 'Đã cập nhật số lượng' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});
// ─── DELETE /api/cart/:volumeId → xóa 1 dòng khỏi giỏ
router.delete('/:volumeId', async (req, res) => {
  try {
    const volumeId = parseInt(req.params.volumeId);
    if (!volumeId) return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    const pool = await poolPromise;
    const cartId = await getOrCreateCartId(pool, req.user.id);
    await pool.request()
      .input('cartId', sql.Int, cartId)
      .input('volumeId', sql.Int, volumeId)
      .query('DELETE FROM CartItems WHERE CartId = @cartId AND VolumeId = @volumeId');
    res.json({ message: 'Đã xóa khỏi giỏ hàng' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

module.exports = router;