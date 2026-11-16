import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

// Bọc quanh trang admin: chưa đăng nhập → về trang đăng nhập; không phải admin → báo không có quyền
function QuanTriRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") {
    return <p className="cart-empty">Bạn không có quyền truy cập trang này.</p>;
  }
  return children;
}

export default QuanTriRoute;