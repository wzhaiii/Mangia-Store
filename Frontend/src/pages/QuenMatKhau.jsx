import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../api/authApi';
import './Auth.css';
import { useThongBao } from "../context/thongBaoContext";
export default function QuenMatKhau() {
  const [buoc, setBuoc] = useState('email'); // 'email' = nhập email, 'doi' = nhập mã + mật khẩu mới
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [mkMoi, setMkMoi] = useState('');
  const [nhapLai, setNhapLai] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [giayCho, setGiayCho] = useState(0);
  const navigate = useNavigate();
  const { hienThongBao } = useThongBao();
  // Đếm ngược cho nút "Gửi lại mã"
  useEffect(() => {
    if (giayCho <= 0) return;
    const timer = setTimeout(() => setGiayCho((g) => g - 1), 1000);
    return () => clearTimeout(timer);
  }, [giayCho]);

  // Bước 1: gửi mã (cũng dùng cho nút "Gửi lại mã")
  const guiMa = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await forgotPassword({ email });
      setBuoc('doi');
      setGiayCho(60);
      setOtp('');
      setInfo(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: gửi mã + mật khẩu mới
  const doiMatKhau = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (mkMoi !== nhapLai) {
      setError('Mật khẩu nhập lại không khớp');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ email, otp, newPassword: mkMoi });
      hienThongBao('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  if (buoc === 'doi') {
    return (
      <div className="auth-container">
        <form className="auth-form" onSubmit={doiMatKhau}>
          <h2>Đặt lại mật khẩu</h2>
          {info && <p className="auth-info">{info}</p>}
          <input
            type="text" inputMode="numeric" maxLength={6} placeholder="Nhập mã 6 chữ số"
            value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} required
          />
          <input
            type="password" placeholder="Mật khẩu mới (từ 6 ký tự)"
            value={mkMoi} onChange={(e) => setMkMoi(e.target.value)} required minLength={6}
          />
          <input
            type="password" placeholder="Nhập lại mật khẩu mới"
            value={nhapLai} onChange={(e) => setNhapLai(e.target.value)} required
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading || otp.length !== 6}>
            {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
          <button type="button" onClick={() => guiMa()} disabled={giayCho > 0 || loading}>
            {giayCho > 0 ? `Gửi lại mã sau ${giayCho}s` : 'Gửi lại mã'}
          </button>
          <p className="auth-switch">
            Nhập sai email?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setBuoc('email'); setError(''); setInfo(''); }}>
              Quay lại
            </a>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={guiMa}>
        <h2>Quên mật khẩu</h2>
        <p className="auth-info">Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác minh để bạn đặt lại mật khẩu.</p>
        <input
          type="email" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)} required
        />
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Đang gửi mã...' : 'Gửi mã xác minh'}
        </button>
        <p className="auth-switch">
          <Link to="/login">← Quay lại đăng nhập</Link>
        </p>
      </form>
    </div>
  );
}