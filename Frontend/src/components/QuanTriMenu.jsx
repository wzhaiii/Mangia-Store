import { NavLink } from "react-router-dom";

// Thanh menu dùng chung cho mọi trang quản trị
const MUC = [
  ["/admin/orders", "Đơn hàng"],
  ["/admin/books", "Sản phẩm"],
  ["/admin/stock", "Kho"],
  ["/admin/users", "Người dùng"],
  ["/admin/reviews", "Đánh giá"],
  ["/admin/reports", "Báo cáo"],
  ["/admin/vouchers", "Mã giảm giá"],
  ["/admin/returns", "Đổi trả & hoàn tiền"],
];

function QuanTriMenu() {
  return (
    <div className="admin-menu">
      {MUC.map(([to, ten]) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `admin-menu__item ${isActive ? "active" : ""}`}
        >
          {ten}
        </NavLink>
      ))}
    </div>
  );
}

export default QuanTriMenu;