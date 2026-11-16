const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { sql, poolPromise } = require('../config/database');
const { register, login, verifyOtp, resendOtp, forgotPassword, resetPassword } = require('../controllers/authController');
const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/login', login);

router.post('/google', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'Thiếu token Google' });
  }

  try {
    // 1. Xác thực token với Google (token giả sẽ throw lỗi tại đây)
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name, picture, sub: googleId, email_verified } = ticket.getPayload();

    if (!email_verified) {
      return res.status(401).json({ message: 'Email Google chưa được xác minh' });
    }

    const pool = await poolPromise;

    // 2. Tìm user theo email
    let result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT id, fullName, email, role, IsLocked FROM Users WHERE email = @email');
    let user = result.recordset[0];

    // 3. Chưa có thì tạo mới (không có mật khẩu)
    if (!user) {
      result = await pool.request()
        .input('fullName', sql.NVarChar, name || email.split('@')[0])
        .input('email', sql.NVarChar, email)
        .input('googleId', sql.NVarChar, googleId)
        .query(`
          INSERT INTO Users (fullName, email, googleId, provider)
          OUTPUT INSERTED.id, INSERTED.fullName, INSERTED.email, INSERTED.role
          VALUES (@fullName, @email, @googleId, 'google')
        `);
      user = result.recordset[0];
    }
    // Tài khoản bị khóa thì không cho đăng nhập
    if (user.IsLocked) {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa' });
}
    // 4. Tạo JWT giống hệt luồng login thường (cùng payload, cùng thời hạn)
    const mangiaToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 5. Trả về cùng dạng với /login để frontend dùng chung một cách
    res.status(200).json({
      message: 'Đăng nhập Google thành công',
      token: mangiaToken,
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role || 'user'},
    });
  } catch (err) {
    console.error('Lỗi /google:', err);
    res.status(401).json({ message: 'Xác thực Google thất bại' });
  }
});
module.exports = router;