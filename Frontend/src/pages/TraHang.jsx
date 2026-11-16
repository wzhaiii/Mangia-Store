import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useThongBao } from "../context/thongBaoContext";
import { getEligible, createReturn } from "../api/returnApi";
import { LOAI_DOI_TRA, dinhDangNgay, layLoi } from "../utils/trangthai";

function TraHang() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hienThongBao } = useThongBao();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState(null);
  const [type, setType] = useState("refund");
  const [reason, setReason] = useState("");
  const [refundInfo, setRefundInfo] = useState("");
  const [soLuong, setSoLuong] = useState({}); // { volumeId: số quyển muốn trả }, 0 = không trả
  const [dangGui, setDangGui] = useState(false);
  const [thongBao, setThongBao] = useState(null);

  useEffect(() => {
    if (!user) return;
    getEligible(id)
      .then((res) => setData(res.data))
      .catch((err) => setLoi(layLoi(err)))
      .finally(() => setLoading(false));
  }, [id, user?.id]);

  if (!user) return <Navigate to="/login" replace />;
  if (loading) return <p>Đang tải...</p>;
  if (loi) return <p className="cart-message cart-message--loi">{loi}</p>;

  const handleDoiSoLuong = (item, giaTri) => {
    const n = Math.min(Math.max(Number(giaTri) || 0, 0), item.conLai);
    setSoLuong({ ...soLuong, [item.volumeId]: n });
  };

  const handleGui = async () => {
    setThongBao(null);
    const items = Object.entries(soLuong)
      .filter(([, q]) => q > 0)
      .map(([volumeId, quantity]) => ({ volumeId: Number(volumeId), quantity }));
    if (items.length === 0) {
      setThongBao("Vui lòng chọn số quyển cần đổi trả");
      return;
    }
    if (reason.trim().length < 5) {
      setThongBao("Vui lòng nhập lý do (ít nhất 5 ký tự)");
      return;
    }
    if (type === "refund" && refundInfo.trim().length < 5) {
      setThongBao("Vui lòng nhập thông tin nhận hoàn tiền");
      return;
    }
    setDangGui(true);
    try {
      const res = await createReturn({ orderId: Number(id), type, reason, refundInfo, items });
      hienThongBao(res.data.message);
      navigate("/returns");
    } catch (err) {
      setThongBao(layLoi(err));
    } finally {
      setDangGui(false);
    }
  };

  return (
    <div className="orders-page">
      <Link to={`/orders/${id}`} className="back-link">← Quay lại đơn #{id}</Link>
      <h2 className="orders-page__title">Yêu cầu đổi trả — Đơn #{id}</h2>

      {!data.choPhep ? (
        <p className="cart-message cart-message--loi">{data.lyDo}</p>
      ) : (
        <>
          <p className="admin-hint">
            Hạn gửi yêu cầu: {dinhDangNgay(data.hanChot)}. Chọn số quyển muốn đổi trả cho từng tập bên dưới.
          </p>

          <div className="order-section">
            <h3>Sản phẩm</h3>
            {data.items.map((it) => (
              <div className="return-row" key={it.volumeId}>
                <div>
                  <strong>{it.title}</strong> — Tập {it.volumeNo}
                  <p className="admin-hint">Đã mua {it.daMua}, còn được trả tối đa {it.conLai}</p>
                </div>
                <input
                  type="number" min="0" max={it.conLai}
                  className="admin-input-small"
                  disabled={it.conLai === 0}
                  value={soLuong[it.volumeId] ?? 0}
                  onChange={(e) => handleDoiSoLuong(it, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="order-section">
            <h3>Hình thức xử lý</h3>
            {Object.entries(LOAI_DOI_TRA).map(([ma, ten]) => (
              <label key={ma} className={`checkout-option ${type === ma ? "selected" : ""}`}>
                <input type="radio" name="loai" checked={type === ma} onChange={() => setType(ma)} />
                <span>{ten}</span>
              </label>
            ))}
            <div className="checkout-field">
              <label>Lý do đổi trả *</label>
              <textarea rows="3" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="Ví dụ: sách bị rách bìa, thiếu trang, giao sai tập..." />
            </div>
            {type === "refund" && (
              <div className="checkout-field">
                <label>Thông tin nhận hoàn tiền *</label>
                <input maxLength={255} value={refundInfo} onChange={(e) => setRefundInfo(e.target.value)}
                  placeholder="Ngân hàng - Số tài khoản - Tên chủ tài khoản" />
              </div>
            )}
          </div>

          {thongBao && <p className="cart-message cart-message--loi">{thongBao}</p>}
          <button type="button" className="book-buy-btn" onClick={handleGui} disabled={dangGui}>
            {dangGui ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </>
      )}
    </div>
  );
}

export default TraHang;