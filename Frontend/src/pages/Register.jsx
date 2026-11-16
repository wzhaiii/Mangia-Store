import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, verifyOtp, resendOtp } from '../api/authApi';
import './Auth.css';
import { useThongBao } from "../context/thongBaoContext";
export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [buoc, setBuoc] = useState('form');   // 'form' = điền thông tin, 'otp' = nhập mã
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [giayCho, setGiayCho] = useState(0);  // đếm ngược cho nút "Gửi lại mã"
  const navigate = useNavigate();
  const { hienThongBao } = useThongBao();
  // Mỗi khi giayCho thay đổi và còn > 0, đợi 1 giây rồi trừ đi 1 (đếm ngược)
  useEffect(() => {
    if (giayCho <= 0) return;
    const timer = setTimeout(() => setGiayCho((g) => g - 1), 1000);
    return () => clearTimeout(timer); // thoát trang giữa chừng thì hủy bộ đếm
  }, [giayCho]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Bước 1: gửi thông tin đăng ký, server sẽ gửi mã về email
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await registerUser(form);
      setBuoc('otp');
      setGiayCho(60);
      setInfo(`Chúng tôi đã gửi mã 6 chữ số tới ${form.email}. Mã có hiệu lực 5 phút.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: gửi mã khách nhập để xác minh
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await verifyOtp({ email: form.email, otp });
      hienThongBao('Xác minh thành công! Vui lòng đăng nhập.', 'thanh-cong');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    try {
      await resendOtp({ email: form.email });
      setGiayCho(60);
      setOtp('');
      setInfo('Đã gửi lại mã mới, vui lòng kiểm tra email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  // ===== Màn hình nhập mã OTP =====
  if (buoc === 'otp') {
    return (
      <div className="auth-container">
        <form className="auth-form" onSubmit={handleVerify}>
          <h2>Xác minh email</h2>
          {info && <p className="auth-info">{info}</p>}
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Nhập mã 6 chữ số"
            value={otp}
            // chỉ cho gõ chữ số: xóa mọi ký tự không phải số
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            required
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading || otp.length !== 6}>
            {loading ? 'Đang xử lý...' : 'Xác minh'}
          </button>
          <button type="button" onClick={handleResend} disabled={giayCho > 0}>
            {giayCho > 0 ? `Gửi lại mã sau ${giayCho}s` : 'Gửi lại mã'}
          </button>
          <p className="auth-switch">
            Nhập sai email?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setBuoc('form'); setError(''); setInfo(''); setOtp(''); }}>
              Quay lại
            </a>
          </p>
        </form>
      </div>
    );
  }

  // ===== Màn hình điền thông tin =====
  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Đăng ký tài khoản</h2>
        <input type="text" name="fullName" placeholder="Họ và tên"
          value={form.fullName} onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email"
          value={form.email} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Mật khẩu"
          value={form.password} onChange={handleChange} required minLength={6} />
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Đang gửi mã...' : 'Đăng ký'}
        </button>
        <p className="auth-switch">
          Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
        </p>
      </form>
    </div>
  );
}