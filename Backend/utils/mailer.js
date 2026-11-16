const nodemailer = require('nodemailer');
// "transporter" = người đưa thư: chứa thông tin tài khoản Gmail dùng để gửi
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_APP_PASSWORD,
  },
});

// Gửi mã OTP tới email của khách. Nếu gửi lỗi thì hàm ném lỗi ra cho nơi gọi xử lý
exports.guiMaOtp = (emailNhan, otp) =>
  transporter.sendMail({
    from: `"Mangia Store" <${process.env.MAIL_USER}>`,
    to: emailNhan,
    subject: 'Mã xác minh đăng ký Mangia Store',
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:auto">
        <h2>Xác minh email</h2>
        <p>Mã xác minh của bạn là:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px">${otp}</p>
        <p>Mã có hiệu lực trong <strong>5 phút</strong>.
           Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
        <p style="color:#888">Nếu bạn không đăng ký tại Mangia Store, hãy bỏ qua thư này.</p>
      </div>`,
  });
  exports.guiMaQuenMatKhau = (emailNhan, otp) =>
  transporter.sendMail({
    from: `"Mangia Store" <${process.env.MAIL_USER}>`,
    to: emailNhan,
    subject: 'Mã đặt lại mật khẩu Mangia Store',
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:auto">
        <h2>Đặt lại mật khẩu</h2>
        <p>Mã xác minh của bạn là:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px">${otp}</p>
        <p>Mã có hiệu lực trong <strong>5 phút</strong>.
           Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
        <p style="color:#888">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua thư này.</p>
      </div>`,
  });