const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sql, poolPromise } = require('../config/database');
const crypto = require('crypto');
const { guiMaOtp, guiMaQuenMatKhau } = require('../utils/mailer');

const OTP_HET_HAN_PHUT = 5;     // mã sống 5 phút
const SO_LAN_SAI_TOI_DA = 5;    // nhập sai quá 5 lần thì khóa mã
const CHO_GUI_LAI_GIAY = 60;    // phải đợi 60 giây mới được gửi lại

// Sinh mã 6 chữ số bằng bộ sinh số ngẫu nhiên an toàn của Node (không dùng Math.random)
const taoOtp = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');
const chuanHoaEmail = (e) => String(e || '').trim().toLowerCase();

// ĐĂNG KÝ (bước 1): kiểm tra thông tin, lưu vào bảng tạm, gửi OTP
exports.register = async (req, res) => {
  try {
    const fullName = String(req.body.fullName || '').trim();
    const email = chuanHoaEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Email không đúng định dạng' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải từ 6 ký tự' });
    }

    const pool = await poolPromise;

    // Email đã là tài khoản thật rồi thì không cho đăng ký nữa
    const daCo = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query('SELECT 1 FROM Users WHERE email = @email');
    if (daCo.recordset.length > 0) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Chặn gửi liên tục: nếu email này vừa được gửi mã chưa tới 60 giây thì từ chối
    const cho = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query(`SELECT DATEDIFF(SECOND, LastSentAt, SYSDATETIME()) AS giay
              FROM PendingRegistrations WHERE Email = @email`);
    if (cho.recordset.length && cho.recordset[0].giay < CHO_GUI_LAI_GIAY) {
      const conLai = CHO_GUI_LAI_GIAY - cho.recordset[0].giay;
      return res.status(429).json({ message: `Vui lòng đợi ${conLai} giây rồi thử lại` });
    }

    const otp = taoOtp();
    const passwordHash = await bcrypt.hash(password, 10);
    const otpHash = await bcrypt.hash(otp, 10);

    // MERGE = "có rồi thì cập nhật, chưa có thì thêm mới".
    // Nhờ vậy khách đăng ký lại cùng email thì chỉ ghi đè dòng cũ, không bị lỗi trùng khóa
    await pool.request()
      .input('email', sql.NVarChar(255), email)
      .input('fullName', sql.NVarChar(100), fullName)
      .input('passwordHash', sql.NVarChar(255), passwordHash)
      .input('otpHash', sql.NVarChar(255), otpHash)
      .input('phut', sql.Int, OTP_HET_HAN_PHUT)
      .query(`
        MERGE PendingRegistrations AS t
        USING (SELECT @email AS Email) AS s ON t.Email = s.Email
        WHEN MATCHED THEN UPDATE SET
          FullName = @fullName, PasswordHash = @passwordHash, OtpHash = @otpHash,
          ExpiresAt = DATEADD(MINUTE, @phut, SYSDATETIME()),
          Attempts = 0, LastSentAt = SYSDATETIME()
        WHEN NOT MATCHED THEN INSERT
          (Email, FullName, PasswordHash, OtpHash, ExpiresAt)
          VALUES (@email, @fullName, @passwordHash, @otpHash,
                  DATEADD(MINUTE, @phut, SYSDATETIME()));
      `);

    try {
      await guiMaOtp(email, otp);
    } catch (mailErr) {
      console.error('Lỗi gửi mail:', mailErr);
      await pool.request()
        .input('email', sql.NVarChar(255), email)
        .query('DELETE FROM PendingRegistrations WHERE Email = @email');
      return res.status(500).json({ message: 'Không gửi được email xác minh, vui lòng kiểm tra lại địa chỉ email' });
    }

    res.status(200).json({ message: 'Đã gửi mã xác minh tới email của bạn', email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// XÁC MINH OTP (bước 2): đúng mã thì mới tạo tài khoản thật
exports.verifyOtp = async (req, res) => {
  const email = chuanHoaEmail(req.body.email);
  const otp = String(req.body.otp || '').trim();
  if (!email || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ message: 'Mã xác minh gồm 6 chữ số' });
  }

  try {
    const pool = await poolPromise;
    const r = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query(`
        SELECT FullName, PasswordHash, OtpHash, Attempts,
               CASE WHEN ExpiresAt < SYSDATETIME() THEN 1 ELSE 0 END AS hetHan
        FROM PendingRegistrations WHERE Email = @email
      `);
    const p = r.recordset[0];
    if (!p) {
      return res.status(400).json({ message: 'Không tìm thấy yêu cầu đăng ký, vui lòng đăng ký lại' });
    }
    if (p.hetHan) {
      return res.status(400).json({ message: 'Mã đã hết hạn, vui lòng bấm "Gửi lại mã"' });
    }
    if (p.Attempts >= SO_LAN_SAI_TOI_DA) {
      return res.status(429).json({ message: 'Bạn đã nhập sai quá nhiều lần, vui lòng bấm "Gửi lại mã" để nhận mã mới' });
    }

    const dung = await bcrypt.compare(otp, p.OtpHash);
    if (!dung) {
      // Cộng 1 lần sai; OUTPUT trả về luôn số lần sai mới để tính số lần còn lại
      const up = await pool.request()
        .input('email', sql.NVarChar(255), email)
        .query(`UPDATE PendingRegistrations SET Attempts = Attempts + 1
                OUTPUT INSERTED.Attempts WHERE Email = @email`);
      const conLai = Math.max(SO_LAN_SAI_TOI_DA - up.recordset[0].Attempts, 0);
      return res.status(400).json({ message: `Mã không đúng. Bạn còn ${conLai} lần thử` });
    }

    // Mã đúng: tạo tài khoản + xóa dòng tạm TRONG CÙNG 1 GIAO DỊCH
    // (giao dịch = làm cả hai việc hoặc không làm việc nào, không bao giờ dở dang)
    const transaction = new sql.Transaction(pool);
    try {
      await transaction.begin();
      const trung = await new sql.Request(transaction)
        .input('email', sql.NVarChar(255), email)
        .query('SELECT 1 FROM Users WHERE email = @email');
      if (trung.recordset.length) throw new Error('EMAIL_TON_TAI');

      await new sql.Request(transaction)
        .input('fullName', sql.NVarChar, p.FullName)
        .input('email', sql.NVarChar, email)
        .input('password', sql.NVarChar, p.PasswordHash)
        .query('INSERT INTO Users (fullName, email, password) VALUES (@fullName, @email, @password)');

      await new sql.Request(transaction)
        .input('email', sql.NVarChar(255), email)
        .query('DELETE FROM PendingRegistrations WHERE Email = @email');

      await transaction.commit();
    } catch (e) {
      try { await transaction.rollback(); } catch {}
      if (e.message === 'EMAIL_TON_TAI') {
        return res.status(400).json({ message: 'Email đã được sử dụng' });
      }
      throw e;
    }

    res.status(201).json({ message: 'Xác minh thành công, tài khoản đã được tạo' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// GỬI LẠI MÃ
exports.resendOtp = async (req, res) => {
  try {
    const email = chuanHoaEmail(req.body.email);
    if (!email) return res.status(400).json({ message: 'Thiếu email' });

    const pool = await poolPromise;
    const r = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query(`SELECT DATEDIFF(SECOND, LastSentAt, SYSDATETIME()) AS giay
              FROM PendingRegistrations WHERE Email = @email`);
    if (!r.recordset.length) {
      return res.status(400).json({ message: 'Không tìm thấy yêu cầu đăng ký, vui lòng đăng ký lại' });
    }
    if (r.recordset[0].giay < CHO_GUI_LAI_GIAY) {
      const conLai = CHO_GUI_LAI_GIAY - r.recordset[0].giay;
      return res.status(429).json({ message: `Vui lòng đợi ${conLai} giây rồi thử lại` });
    }

    const otp = taoOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    await pool.request()
      .input('email', sql.NVarChar(255), email)
      .input('otpHash', sql.NVarChar(255), otpHash)
      .input('phut', sql.Int, OTP_HET_HAN_PHUT)
      .query(`
        UPDATE PendingRegistrations
        SET OtpHash = @otpHash, ExpiresAt = DATEADD(MINUTE, @phut, SYSDATETIME()),
            Attempts = 0, LastSentAt = SYSDATETIME()
        WHERE Email = @email
      `);

    try {
      await guiMaOtp(email, otp);
    } catch (mailErr) {
      console.error('Lỗi gửi mail:', mailErr);
      return res.status(500).json({ message: 'Không gửi được email, vui lòng thử lại sau' });
    }
    res.json({ message: 'Đã gửi lại mã xác minh' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};
// ĐĂNG NHẬP
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
    }
    // Kiểm tra email có tồn tại trong cơ sở dữ liệu không
    const pool = await poolPromise;
    const result = await pool.request().input('email', sql.NVarChar, email).query('SELECT * FROM Users WHERE email = @email');
    const user = result.recordset[0];
    if (!user) {
      return res.status(400).json({ message: 'Email không tồn tại' });
    }
    // Tài khoản bị quản trị viên khóa thì không cho đăng nhập
    if (user.IsLocked) {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa' });
    }
    // Tài khoản tạo bằng Google thì không có mật khẩu
    if (!user.password) {
      return res.status(400).json({ message: 'Tài khoản này đăng nhập bằng Google, vui lòng dùng nút Đăng nhập với Google' });
    }
    // So sánh mật khẩu đã nhập với mật khẩu đã mã hoá trong DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu không chính xác' });
    }
    // Tạo JWT token, hết hạn sau 1 ngày
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.status(200).json({
      message: 'Đăng nhập thành công',
      token,
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.Role || 'user' },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};
// QUÊN MẬT KHẨU (bước 1): gửi mã về email
exports.forgotPassword = async (req, res) => {
  try {
    const email = chuanHoaEmail(req.body.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Email không đúng định dạng' });
    }
    // Luôn trả thông báo này, dù email có tồn tại hay không (để người lạ không dò được)
    const THONG_BAO = 'Chúng tôi đã gửi mã xác minh tới hộp thư của bạn';

    const pool = await poolPromise;
    const u = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query('SELECT password, IsLocked FROM Users WHERE email = @email');
    const user = u.recordset[0];
    // Không có tài khoản / tài khoản Google (không có mật khẩu) / đang bị khóa → im lặng, không gửi
    if (!user || !user.password || user.IsLocked) {
      return res.json({ message: THONG_BAO });
    }

    // Chống gửi liên tục: chưa đủ 60 giây kể từ lần gửi trước thì không gửi nữa
    const cho = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query(`SELECT DATEDIFF(SECOND, LastSentAt, SYSDATETIME()) AS giay
              FROM PasswordResets WHERE Email = @email`);
    if (cho.recordset.length && cho.recordset[0].giay < CHO_GUI_LAI_GIAY) {
      return res.json({ message: THONG_BAO });
    }

    const otp = taoOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    await pool.request()
      .input('email', sql.NVarChar(255), email)
      .input('otpHash', sql.NVarChar(255), otpHash)
      .input('phut', sql.Int, OTP_HET_HAN_PHUT)
      .query(`
        MERGE PasswordResets AS t
        USING (SELECT @email AS Email) AS s ON t.Email = s.Email
        WHEN MATCHED THEN UPDATE SET
          OtpHash = @otpHash, ExpiresAt = DATEADD(MINUTE, @phut, SYSDATETIME()),
          Attempts = 0, LastSentAt = SYSDATETIME()
        WHEN NOT MATCHED THEN INSERT (Email, OtpHash, ExpiresAt)
          VALUES (@email, @otpHash, DATEADD(MINUTE, @phut, SYSDATETIME()));
      `);

    try {
      await guiMaQuenMatKhau(email, otp);
    } catch (mailErr) {
      console.error('Lỗi gửi mail:', mailErr);
      await pool.request()
        .input('email', sql.NVarChar(255), email)
        .query('DELETE FROM PasswordResets WHERE Email = @email');
      return res.status(500).json({ message: 'Không gửi được email, vui lòng thử lại sau' });
    }
    res.json({ message: THONG_BAO });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// QUÊN MẬT KHẨU (bước 2): kiểm tra mã rồi đặt mật khẩu mới
exports.resetPassword = async (req, res) => {
  try {
    const email = chuanHoaEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();
    const matKhauMoi = String(req.body.newPassword || '');
    if (!email || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'Mã xác minh gồm 6 chữ số' });
    }
    if (matKhauMoi.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải từ 6 ký tự' });
    }
    if (matKhauMoi.length > 72) {
      return res.status(400).json({ message: 'Mật khẩu mới tối đa 72 ký tự' });
    }

    const pool = await poolPromise;
    const r = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query(`
        SELECT OtpHash, Attempts,
               CASE WHEN ExpiresAt < SYSDATETIME() THEN 1 ELSE 0 END AS hetHan
        FROM PasswordResets WHERE Email = @email
      `);
    const p = r.recordset[0];
    if (!p) {
      return res.status(400).json({ message: 'Không tìm thấy yêu cầu, vui lòng gửi lại mã' });
    }
    if (p.hetHan) {
      return res.status(400).json({ message: 'Mã đã hết hạn, vui lòng bấm "Gửi lại mã"' });
    }
    if (p.Attempts >= SO_LAN_SAI_TOI_DA) {
      return res.status(429).json({ message: 'Bạn đã nhập sai quá nhiều lần, vui lòng bấm "Gửi lại mã" để nhận mã mới' });
    }

    const dung = await bcrypt.compare(otp, p.OtpHash);
    if (!dung) {
      const up = await pool.request()
        .input('email', sql.NVarChar(255), email)
        .query(`UPDATE PasswordResets SET Attempts = Attempts + 1
                OUTPUT INSERTED.Attempts WHERE Email = @email`);
      const conLai = Math.max(SO_LAN_SAI_TOI_DA - up.recordset[0].Attempts, 0);
      return res.status(400).json({ message: `Mã không đúng. Bạn còn ${conLai} lần thử` });
    }

    // Mã đúng: đổi mật khẩu + xóa dòng mã TRONG CÙNG 1 GIAO DỊCH (làm cả hai hoặc không làm gì)
    const hashMoi = await bcrypt.hash(matKhauMoi, 10);
    const transaction = new sql.Transaction(pool);
    try {
      await transaction.begin();
      await new sql.Request(transaction)
        .input('email', sql.NVarChar(255), email)
        .input('hash', sql.NVarChar(255), hashMoi)
        .query('UPDATE Users SET password = @hash WHERE email = @email');
      await new sql.Request(transaction)
        .input('email', sql.NVarChar(255), email)
        .query('DELETE FROM PasswordResets WHERE Email = @email');
      await transaction.commit();
    } catch (e) {
      try { await transaction.rollback(); } catch {}
      throw e;
    }
    res.json({ message: 'Đã đặt lại mật khẩu, vui lòng đăng nhập' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};