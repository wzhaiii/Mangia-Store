import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useThongBao } from "../context/thongBaoContext";
import { getMyReturns, cancelReturn } from "../api/returnApi";
import {
  TRANG_THAI_DOI_TRA, LOAI_DOI_TRA, TRANG_THAI_HOAN_TIEN, dinhDangNgay, layLoi,
} from "../utils/trangthai";

function YeuCauDoiTra() {
  const { user } = useAuth();
  const { hoiXacNhan, hienThongBao } = useThongBao();
  const [ds, setDs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState(null);

  const tai = useCallback(() => {
    return getMyReturns()
      .then((res) => setDs(res.data))
      .catch((err) => setLoi(layLoi(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (user) tai(); }, [user?.id, tai]);

  if (!user) return <Navigate to="/login" replace />;

  const handleHuy = async (yc) => {
    if (!(await hoiXacNhan("Bạn chắc chắn muốn hủy yêu cầu này?"))) return;
    try {
      const res = await cancelReturn(yc.id);
      hienThongBao(res.data.message);
      await tai();
    } catch (err) {
      hienThongBao(layLoi(err), "loi");
    }
  };

  return (
    <div className="orders-page">
      <h2 className="orders-page__title">Yêu cầu đổi trả của tôi</h2>
      {loading && <p>Đang tải...</p>}
      {loi && <p className="cart-message cart-message--loi">{loi}</p>}
      {!loading && !loi && ds.length === 0 && (
        <p className="cart-empty">
          Bạn chưa có yêu cầu đổi trả nào. <Link to="/orders">Xem đơn hàng</Link>
        </p>
      )}
      <div className="orders-list">
        {ds.map((yc) => (
          <div className="order-card" key={yc.id}>
            <div className="order-card__top">
              <strong>Yêu cầu #{yc.id} (đơn <Link to={`/orders/${yc.orderId}`}>#{yc.orderId}</Link>)</strong>
              <span className={`status-badge status-${yc.status}`}>{TRANG_THAI_DOI_TRA[yc.status]}</span>
            </div>
            <p>{LOAI_DOI_TRA[yc.type]} — gửi lúc {dinhDangNgay(yc.createdAt)}</p>
            <p>Sản phẩm: {yc.tomTat}</p>
            <p>Lý do: {yc.reason}</p>
            {yc.adminNote && <p>Phản hồi của cửa hàng: {yc.adminNote}</p>}
            {yc.refundAmount != null && (
              <p>
                Hoàn tiền: <strong>{yc.refundAmount.toLocaleString("vi-VN")} VNĐ</strong> —{" "}
                <span className={`status-badge status-${yc.refundStatus}`}>
                  {TRANG_THAI_HOAN_TIEN[yc.refundStatus]}
                </span>
              </p>
            )}
            {yc.status === "requested" && (
              <button type="button" className="admin-view-btn" onClick={() => handleHuy(yc)}>
                Hủy yêu cầu
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default YeuCauDoiTra;