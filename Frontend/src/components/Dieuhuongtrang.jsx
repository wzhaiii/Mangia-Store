import { useState, useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { LogIn, UserPlus, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/authContext";
import { useCart } from "../context/cartContext";
import icon from "../assets/images/Mangia-logo-blue.png";

function Navbar() {
  const { user, logout } = useAuth();
  const { totalQuantity } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [moMenu, setMoMenu] = useState(false); // menu thu gọn (trên điện thoại) đang mở hay đóng

  // Chuyển sang trang khác (hoặc nhảy tới mục #...) thì tự đóng menu
  useEffect(() => {
    setMoMenu(false);
  }, [location.pathname, location.hash]);

  const handleLogout = () => {
    logout();
    setMoMenu(false);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <img src={icon} alt="Logo" className="navbar-icon" />
      <div className="navbar-logo">MANGIA STORE</div>

      {/* Khung bọc menu: trên máy tính nó "vô hình", trên điện thoại nó là menu thả xuống */}
      <div className={`navbar-menu ${moMenu ? "open" : ""}`}>
        <ul className="navbar-links">
          <li><Link to="/" className={location.pathname === "/" && !location.hash ? "active" : ""}>Trang chủ</Link></li>
          <li><NavLink to="/shop" className={({ isActive }) => (isActive ? "active" : "")}>Cửa hàng</NavLink></li>
          <li><Link to="/#gioi-thieu" className={location.pathname === "/" && location.hash === "#gioi-thieu" ? "active" : ""}>Giới thiệu</Link></li>
          <li><Link to="/#danh-gia" className={location.pathname === "/" && location.hash === "#danh-gia" ? "active" : ""}>Đánh giá</Link></li>
          <li><Link to="/#lien-he" className={location.pathname === "/" && location.hash === "#lien-he" ? "active" : ""}>Liên hệ</Link></li>
          {user && (
            <li><NavLink to="/orders" className={({ isActive }) => (isActive ? "active" : "")}>Đơn hàng</NavLink></li>
          )}
          {user && (
            <li><NavLink to="/returns" className={({ isActive }) => (isActive ? "active" : "")}>Đổi trả</NavLink></li>
          )}
          {user?.role === "admin" && (
            <li><NavLink to="/admin/orders" className={({ isActive }) => (isActive ? "active" : "")}>Quản trị</NavLink></li>
          )}
        </ul>

        {user ? (
          <div className="navbar-user">
            <Link to="/profile" className="navbar-greeting" title="Xem và chỉnh sửa thông tin tài khoản">
              <strong>Xin chào, {user.fullName}</strong>
            </Link>
            <button type="button" className="navbar-logout" onClick={handleLogout}>
              <LogOut size={16} />Đăng xuất
            </button>
          </div>
        ) : (
          <>
            <Link to="/register" className="navbar-register"><UserPlus size={16} />Đăng ký</Link>
            <Link to="/login" className="navbar-login"><LogIn size={16} />Đăng nhập</Link>
          </>
        )}
      </div>

      <div className="navbar-actions">
        <Link to="/cart" className="navbar-cart">🛒
          {totalQuantity > 0 && <span className="navbar-cart__badge">{totalQuantity}</span>}
        </Link>
      </div>

      {/* Nút ba gạch: chỉ hiện trên màn hình nhỏ (do CSS quyết định) */}
      <button
        type="button"
        className="navbar-toggle"
        onClick={() => setMoMenu(!moMenu)}
        aria-label={moMenu ? "Đóng menu" : "Mở menu"}
        aria-expanded={moMenu}
      >
        {moMenu ? <X size={26} /> : <Menu size={26} />}
      </button>
    </nav>
  );
}
export default Navbar;