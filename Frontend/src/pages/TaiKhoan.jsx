import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { getProfile, updateProfile, changePassword } from "../api/profileApi";
import { layLoi } from "../utils/trangthai";

function TaiKhoan() {
  const { user, updateUser } = useAuth();

  const [hoSo, setHoSo] = useState(null);       // thông tin lấy từ server
  const [form, setForm] = useState({ fullName: "", phone: "", address: "", ward: "", province: "" });
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState(null);
  const [dangLuu, setDangLuu] = useState(false);
  const [thongBao, setThongBao] = useState(null);

  const [mk, setMk] = useState({ hienTai: "", moi: "", nhapLai: "" });
  const [dangDoiMk, setDangDoiMk] = useState(false);
  const [thongBaoMk, setThongBaoMk] = useState(null);

  // Tải hồ sơ khi trang vừa hiện ra
  useEffect(() => {
    if (!user) return;
    getProfile()
      .then((res) => {
        const p = res.data;
        setHoSo(p);
        setForm({
          fullName: p.fullName || "",
          phone: p.phone || "",
          address: p.address || "",
          ward: p.ward || "",
          province: p.province || "",
        });
      })
      .catch((err) => setLoi(layLoi(err)))
      .finally(() => setLoading(false));
  }, [user?.id]); // chỉ tải lại khi đổi sang tài khoản khác (đổi tên không kích hoạt lại)

  // Chưa đăng nhập thì chuyển sang trang đăng nhập (đặt SAU các useEffect/useState)
  if (!user) return <Navigate to="/login" replace />;

  const handleDoi = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLuu = async (e) => {
    e.preventDefault();
    setThongBao(null);
    if (!form.fullName.trim()) {
      setThongBao({ loai: "loi", noiDung: "Vui lòng nhập họ tên" });
      return;
    }
    if (form.phone.trim() && !/^0\d{9}$/.test(form.phone.trim())) {
      setThongBao({ loai: "loi", noiDung: "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0" });
      return;
    }
    setDangLuu(true);
    try {
      const res = await updateProfile(form);
      updateUser({ fullName: res.data.fullName }); // cập nhật tên trên thanh menu
      setThongBao({ loai: "thanh-cong", noiDung: res.data.message });
    } catch (err) {
      setThongBao({ loai: "loi", noiDung: layLoi(err) });
    } finally {
      setDangLuu(false);
    }
  };

  const handleDoiMatKhau = async (e) => {
    e.preventDefault();
    setThongBaoMk(null);
    if (mk.moi.length < 6) {
      setThongBaoMk({ loai: "loi", noiDung: "Mật khẩu mới phải từ 6 ký tự" });
      return;
    }
    if (mk.moi !== mk.nhapLai) {
      setThongBaoMk({ loai: "loi", noiDung: "Mật khẩu nhập lại không khớp" });
      return;
    }
    setDangDoiMk(true);
    try {
      const res = await changePassword({ currentPassword: mk.hienTai, newPassword: mk.moi });
      setThongBaoMk({ loai: "thanh-cong", noiDung: res.data.message });
      setMk({ hienTai: "", moi: "", nhapLai: "" });
    } catch (err) {
      setThongBaoMk({ loai: "loi", noiDung: layLoi(err) });
    } finally {
      setDangDoiMk(false);
    }
  };

  if (loading) return <p>Đang tải...</p>;
  if (loi) return <p className="cart-message cart-message--loi">{loi}</p>;

  return (
    <div className="orders-page">
      <h2 className="orders-page__title">Tài khoản của tôi</h2>

      {/* ===== Thông tin chỉ xem ===== */}
      <div className="order-section">
        <h3>Thông tin tài khoản</h3>
        <p>Email: <strong>{hoSo.email}</strong></p>
        <p>Đăng nhập bằng: {hoSo.provider === "google" ? "Google" : "Email và mật khẩu"}</p>
        <p>Loại tài khoản: {hoSo.role === "admin" ? "Quản trị viên" : "Khách hàng"}</p>
        <p>
          Số đơn đã đặt: {hoSo.soDon}{" "}
          {hoSo.soDon > 0 && <Link to="/orders">(xem đơn hàng)</Link>}
        </p>
        <small className="admin-hint">Email và loại tài khoản không thể tự thay đổi.</small>
      </div>

      {/* ===== Form sửa thông tin cá nhân ===== */}
      <form className="order-section" onSubmit={handleLuu}>
        <h3>Thông tin cá nhân</h3>
        <div className="checkout-field">
          <label>Họ và tên *</label>
          <input name="fullName" value={form.fullName} onChange={handleDoi} maxLength={100} />
        </div>
        <div className="checkout-field">
          <label>Số điện thoại</label>
          <input name="phone" value={form.phone} onChange={handleDoi} inputMode="numeric" maxLength={10} />
        </div>
        <div className="checkout-field">
          <label>Địa chỉ (số nhà, tên đường)</label>
          <input name="address" value={form.address} onChange={handleDoi} maxLength={255} />
        </div>
        <div className="checkout-row">
          <div className="checkout-field">
            <label>Phường/Xã</label>
            <input name="ward" value={form.ward} onChange={handleDoi} maxLength={100} />
          </div>
          <div className="checkout-field">
            <label>Tỉnh/Thành phố</label>
            <input name="province" value={form.province} onChange={handleDoi} maxLength={100} />
          </div>
        </div>
        <small className="admin-hint">
          Thông tin giao hàng này sẽ được điền sẵn khi bạn thanh toán.
        </small>
        {thongBao && (
          <p className={`cart-message cart-message--${thongBao.loai}`}>{thongBao.noiDung}</p>
        )}
        <div className="modal-actions">
          <button type="submit" className="book-buy-btn" disabled={dangLuu}>
            {dangLuu ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>

      {/* ===== Đổi mật khẩu (chỉ tài khoản có mật khẩu) ===== */}
      {hoSo.coMatKhau && (
        <form className="order-section" onSubmit={handleDoiMatKhau}>
          <h3>Đổi mật khẩu</h3>
          <div className="checkout-field">
            <label>Mật khẩu hiện tại</label>
            <input type="password" value={mk.hienTai}
              onChange={(e) => setMk({ ...mk, hienTai: e.target.value })} required />
          </div>
          <div className="checkout-field">
            <label>Mật khẩu mới (từ 6 ký tự)</label>
            <input type="password" value={mk.moi}
              onChange={(e) => setMk({ ...mk, moi: e.target.value })} required minLength={6} />
          </div>
          <div className="checkout-field">
            <label>Nhập lại mật khẩu mới</label>
            <input type="password" value={mk.nhapLai}
              onChange={(e) => setMk({ ...mk, nhapLai: e.target.value })} required />
          </div>
          {thongBaoMk && (
            <p className={`cart-message cart-message--${thongBaoMk.loai}`}>{thongBaoMk.noiDung}</p>
          )}
          <div className="modal-actions">
            <button type="submit" className="book-buy-btn" disabled={dangDoiMk}>
              {dangDoiMk ? "Đang đổi..." : "Đổi mật khẩu"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default TaiKhoan;