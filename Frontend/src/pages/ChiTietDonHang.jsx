import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrderDetail, cancelOrder } from "../api/orderApi";
import { NGAN_HANG } from "../components/ThanhToan";
import { TRANG_THAI_DON, TRANG_THAI_THANH_TOAN, PHUONG_THUC, HANG_VAN_CHUYEN, dinhDangNgay, layLoi,} from "../utils/trangthai";
import { useThongBao } from "../context/thongBaoContext";
import  TienTrinhDon from "../components/TienTrinhDon";
function ChiTietDonHang() {
  const { id } = useParams();
  const { hoiXacNhan } = useThongBao();
  const [don, setDon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState(null);
  const [dangHuy, setDangHuy] = useState(false);
  const [thongBao, setThongBao] = useState(null);

  const taiDon = () =>
    getOrderDetail(id)
      .then((res) => setDon(res.data))
      .catch((err) => setLoi(layLoi(err)))
      .finally(() => setLoading(false));

  useEffect(() => {
    setLoading(true);
    setLoi(null);
    taiDon();
  }, [id]);

  const handleHuy = async () => {
    if (!(await hoiXacNhan("Bạn chắc chắn muốn hủy đơn này?"))) return;
    setDangHuy(true);
    setThongBao(null);
    try {
      await cancelOrder(id);
      await taiDon(); // tải lại để thấy trạng thái mới
    } catch (err) {
      setThongBao(layLoi(err));
    } finally {
      setDangHuy(false);
    }
  };

  if (loading) return <p>Đang tải...</p>;
  if (loi) return <p className="cart-message cart-message--loi">{loi}</p>;

  // Cần hiện lại mã QR khi: chuyển khoản, chưa trả tiền, đơn chưa hủy
  const canTraTien =
    don.paymentMethod === "BANK" && don.paymentStatus === "pending" && don.status !== "cancelled";
  const qrUrl =
    `https://img.vietqr.io/image/${NGAN_HANG.bankId}-${NGAN_HANG.soTaiKhoan}-compact2.png` +
    `?amount=${don.total}` +
    `&addInfo=${encodeURIComponent("MANGIA " + don.id)}` +
    `&accountName=${encodeURIComponent(NGAN_HANG.tenChuTK)}`;

  return (
    < div className="orders-page">
      <Link to="/orders" className="back-link">← Quay lại danh sách đơn</Link>
      <h2 className="orders-page__title">
          <TienTrinhDon status={don.status} />
        Đơn #{don.id}{" "}
        <span className={`status-badge status-${don.status}`}>{TRANG_THAI_DON[don.status]}</span>
      </h2>

      <div className="order-section">
        <h3>Thông tin giao hàng</h3>
        <p>Người nhận: {don.receiverName}</p>
        <p>Điện thoại: {don.phone}</p>
        <p>
          Địa chỉ: {don.address}
          {don.ward ? `, ${don.ward}` : ""}, {don.province}
        </p>
        {don.note && <p>Ghi chú: {don.note}</p>}
        <p>Vận chuyển: {HANG_VAN_CHUYEN[don.shippingCarrier] || don.shippingCarrier}</p>
        <p>Ngày đặt: {dinhDangNgay(don.createdAt)}</p>
      </div>

      <div className="order-section">
        <h3>Thanh toán</h3>
        <p>
          {PHUONG_THUC[don.paymentMethod]} —{" "}
          <span className={`status-badge status-${don.paymentStatus}`}>
            {TRANG_THAI_THANH_TOAN[don.paymentStatus]}
          </span>
        </p>
        {don.paidAt && <p>Đã nhận tiền lúc: {dinhDangNgay(don.paidAt)}</p>}
        {canTraTien && (
          <div className="checkout-qr">
            <p>
              Quét mã để chuyển <strong>{don.total.toLocaleString("vi-VN")} VNĐ</strong>, giữ
              nguyên nội dung <strong>MANGIA {don.id}</strong>.
            </p>
            <img src={qrUrl} alt="Mã QR chuyển khoản" />
          </div>
        )}
      </div>

      <div className="order-section">
        <h3>Sản phẩm đã mua</h3>
        {don.items.map((it) => (
          <div className="order-item" key={it.volumeId}>
            <img className="cart-item__image" src={it.image} alt={it.title} />
            <div className="order-item__info">
              <Link to={`/books/${it.bookId}`} className="cart-item__title">{it.title}</Link>
              <p>Tập {it.volumeNo}</p>
              <p>
                {it.unitPrice.toLocaleString("vi-VN")} VNĐ × {it.quantity}
              </p>
            </div>
            <div className="cart-item__total">
              {(it.unitPrice * it.quantity).toLocaleString("vi-VN")} VNĐ
            </div>
          </div>
        ))}
        <div className="checkout-total">
          <p><span>Tiền hàng</span><span>{don.subtotal.toLocaleString("vi-VN")} VNĐ</span></p>
          {don.discountAmount > 0 && (
            <p>
              <span>Mã giảm giá{don.voucherCode ? ` (${don.voucherCode})` : ""}</span>
              <span>−{don.discountAmount.toLocaleString("vi-VN")} VNĐ</span>
            </p>
          )}
          <p><span>Phí vận chuyển</span><span>{don.shippingFee.toLocaleString("vi-VN")} VNĐ</span></p>
          <p><span>Tổng cộng</span><strong>{don.total.toLocaleString("vi-VN")} VNĐ</strong></p>
        </div>
      </div>

      {thongBao && <p className="cart-message cart-message--loi">{thongBao}</p>}
      {don.status === "pending" && don.paymentStatus !== "paid" && (
        <button type="button" className="btn-danger" onClick={handleHuy} disabled={dangHuy}>
          {dangHuy ? "Đang hủy..." : "Hủy đơn hàng"}
        </button>
      )}
      {don.status === "pending" && don.paymentStatus === "paid" && (
        <p className="admin-hint">
          Đơn đã thanh toán nên không thể tự hủy. Vui lòng liên hệ cửa hàng nếu bạn muốn hủy và nhận hoàn tiền.
        </p>
      )}
    {don.status === "delivered" && (
        <div className="admin-actions">
          <Link to={`/orders/${don.id}/return`} className="book-buy-btn link-nut">
            Yêu cầu đổi trả
          </Link>
        </div>
      )}
    </div>
  );
}
export default ChiTietDonHang;