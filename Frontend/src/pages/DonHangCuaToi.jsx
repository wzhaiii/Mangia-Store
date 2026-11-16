import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { getMyOrders } from "../api/orderApi";
import {
  TRANG_THAI_DON, TRANG_THAI_THANH_TOAN, PHUONG_THUC, dinhDangNgay, layLoi,
} from "../utils/trangthai";

function DonHangCuaToi() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState(null);

  useEffect(() => {
    if (!user) return;
    getMyOrders()
      .then((res) => setOrders(res.data))
      .catch((err) => setLoi(layLoi(err)))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="orders-page">
        <h2 className="orders-page__title">Đơn hàng của tôi</h2>
        <p className="cart-empty">
          Vui lòng <Link to="/login">đăng nhập</Link> để xem đơn hàng.
        </p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h2 className="orders-page__title">Đơn hàng của tôi</h2>
      {loading && <p>Đang tải...</p>}
      {loi && <p className="cart-message cart-message--loi">{loi}</p>}
      {!loading && !loi && orders.length === 0 && (
        <p className="cart-empty">
          Bạn chưa có đơn hàng nào. <Link to="/shop">Đến cửa hàng để chọn truyện</Link>
        </p>
      )}
      <div className="orders-list">
        {orders.map((o) => (
          <Link to={`/orders/${o.id}`} className="order-card" key={o.id}>
            <div className="order-card__top">
              <strong>Đơn #{o.id}</strong>
              <span className={`status-badge status-${o.status}`}>{TRANG_THAI_DON[o.status]}</span>
            </div>
            <p>Ngày đặt: {dinhDangNgay(o.createdAt)}</p>
            <p>Số lượng: {o.soQuyen} quyển</p>
            <p>
              {PHUONG_THUC[o.paymentMethod]} —{" "}
              <span className={`status-badge status-${o.paymentStatus}`}>
                {TRANG_THAI_THANH_TOAN[o.paymentStatus]}
              </span>
            </p>
            <p className="order-card__total">{o.total.toLocaleString("vi-VN")} VNĐ</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default DonHangCuaToi;