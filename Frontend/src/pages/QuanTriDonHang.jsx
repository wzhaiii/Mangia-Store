import { useEffect, useState, useCallback } from "react";
import QuanTriMenu from "../components/QuanTriMenu";
import { getAdminSummary, getAdminOrders, getAdminOrderDetail, changeOrderStatus, confirmPayment} from "../api/adminApi";
import { TRANG_THAI_DON, TRANG_THAI_THANH_TOAN, PHUONG_THUC, HANG_VAN_CHUYEN, CHUYEN_TIEP, NHAN_NUT, dinhDangNgay, layLoi} from "../utils/trangthai";
import { useThongBao } from "../context/thongBaoContext";
const LIMIT = 10;
// ===== Hộp thoại chi tiết 1 đơn (có các nút xử lý) =====
function ChiTietDonAdmin({ id, onClose, onChanged }) {
  const { hoiXacNhan } = useThongBao();
  const [don, setDon] = useState(null);
  const [loi, setLoi] = useState(null);
  const [dangXuLy, setDangXuLy] = useState(false);
  const [thongBao, setThongBao] = useState(null);

  const taiDon = useCallback(() => {
    return getAdminOrderDetail(id)
      .then((res) => setDon(res.data))
      .catch((err) => setLoi(layLoi(err)));
  }, [id]);

  useEffect(() => { taiDon(); }, [taiDon]);

  // Chạy 1 hành động (đổi trạng thái / xác nhận tiền) rồi tải lại dữ liệu
  const chayHanhDong = async (hanhDong, xacNhan) => {
    if (xacNhan && !(await hoiXacNhan(xacNhan))) return;
    setDangXuLy(true);
    setThongBao(null);
    try {
      const res = await hanhDong();
      setThongBao({ loai: "thanh-cong", noiDung: res.data.message });
      await taiDon();
      onChanged(); // báo trang ngoài tải lại danh sách và số liệu
    } catch (err) {
      setThongBao({ loai: "loi", noiDung: layLoi(err) });
    } finally {
      setDangXuLy(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-box modal-box--wide">
        <div className="modal-header">
          <h3>Đơn #{id}</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        {loi && <p className="cart-message cart-message--loi">{loi}</p>}
        {!don && !loi && <p>Đang tải...</p>}

        {don && (
          <>
            <p>
              Trạng thái:{" "}
              <span className={`status-badge status-${don.status}`}>{TRANG_THAI_DON[don.status]}</span>
            </p>
            <p>Ngày đặt: {dinhDangNgay(don.createdAt)}</p>
            <p>Tài khoản đặt: {don.customerName} ({don.customerEmail})</p>

            <h4>Giao hàng</h4>
            <p>Người nhận: {don.receiverName} — {don.phone}</p>
            <p>
              Địa chỉ: {don.address}{don.ward ? `, ${don.ward}` : ""}, {don.province}
            </p>
            {don.note && <p>Ghi chú: {don.note}</p>}
            <p>Vận chuyển: {HANG_VAN_CHUYEN[don.shippingCarrier] || don.shippingCarrier}</p>

            <h4>Thanh toán</h4>
            <p>
              {PHUONG_THUC[don.paymentMethod]} —{" "}
              <span className={`status-badge status-${don.paymentStatus}`}>
                {TRANG_THAI_THANH_TOAN[don.paymentStatus]}
              </span>
            </p>
            {don.paidAt && <p>Nhận tiền lúc: {dinhDangNgay(don.paidAt)}</p>}
            {don.paymentMethod === "BANK" && don.paymentStatus === "pending" && don.status !== "cancelled" && (
              <button
                type="button"
                className="book-buy-btn"
                disabled={dangXuLy}
                onClick={() => chayHanhDong(() => confirmPayment(id), "Xác nhận đã nhận đủ tiền chuyển khoản?")}
              >
                Xác nhận đã nhận tiền
              </button>
            )}
              <h4>Lịch sử đổi trạng thái</h4><ul className="history-list">
                {(don.history || []).map((h, i) => (
                  <li key={i}>
                  <span className="history-time">{dinhDangNgay(h.changedAt)}</span>{" "}
                  {h.fromStatus ? `${TRANG_THAI_DON[h.fromStatus]} → ` : "Tạo đơn → "}
                  <strong>{TRANG_THAI_DON[h.toStatus]}</strong>
                  {" — "}{h.changedByName || "Không rõ"}
                  {h.changedByRole === "admin" ? " (quản trị)" : h.changedByName ? " (khách)" : ""}
                  {h.note ? ` — ${h.note}` : ""}
                  </li>
              ))}
</ul>
            <h4>Sản phẩm</h4>
            {don.items.map((it) => (
              <div className="order-item" key={it.volumeId}>
                <img className="cart-item__image" src={it.image} alt={it.title} />
                <div className="order-item__info">
                  <strong>{it.title}</strong>
                  <p>Tập {it.volumeNo} — {it.unitPrice.toLocaleString("vi-VN")} VNĐ × {it.quantity}</p>
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

            {thongBao && (
              <p className={`cart-message cart-message--${thongBao.loai}`}>{thongBao.noiDung}</p>
            )}

            <div className="admin-actions">
              {CHUYEN_TIEP[don.status].map((tt) => (
                <button
                  key={tt}
                  type="button"
                  className={tt === "cancelled" ? "btn-danger" : "book-buy-btn"}
                  disabled={dangXuLy}
                  onClick={() =>
                    chayHanhDong(
                      () => changeOrderStatus(id, tt),
                      tt === "cancelled" ? "Hủy đơn này và cộng trả số quyển vào kho?" : null
                    )
                  }
                >
                  {NHAN_NUT[tt]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ===== Trang quản trị chính =====
function QuanTriDonHang() {
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");          // "" = tất cả
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");          // từ khóa thật sự dùng để tìm
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState(null);
  const [dangXem, setDangXem] = useState(null);      // mã đơn đang mở trong hộp thoại

  const taiSoLieu = useCallback(() => {
    getAdminSummary().then((res) => setSummary(res.data)).catch(() => {});
  }, []);

  const taiDanhSach = useCallback(() => {
    setLoading(true);
    setLoi(null);
    getAdminOrders({ status: status || undefined, search: search || undefined, page, limit: LIMIT })
      .then((res) => {
        setOrders(res.data.data);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.total);
      })
      .catch((err) =>
        setLoi(err.response?.status === 403 ? "Bạn không có quyền quản trị" : layLoi(err))
      )
      .finally(() => setLoading(false));
  }, [status, search, page]);

  useEffect(() => { taiSoLieu(); }, [taiSoLieu]);
  useEffect(() => { taiDanhSach(); }, [taiDanhSach]);

  const handleTimKiem = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleChonTab = (tt) => {
    setStatus(tt);
    setPage(1);
  };

  const handleDaThayDoi = () => {
    taiSoLieu();
    taiDanhSach();
  };

  const cacTab = [["", "Tất cả"], ...Object.entries(TRANG_THAI_DON)];
  const tongDon = summary ? Object.values(summary.counts).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="admin-page">
      <h2 className="orders-page__title">Quản trị đơn hàng</h2>
  <QuanTriMenu />
      {summary && (
        <div className="admin-stats">
          <div className="admin-stat"><span>Tổng số đơn</span><strong>{tongDon}</strong></div>
          <div className="admin-stat"><span>Chờ xác nhận</span><strong>{summary.counts.pending}</strong></div>
          <div className="admin-stat"><span>Đang giao</span><strong>{summary.counts.shipping}</strong></div>
          <div className="admin-stat">
            <span>Doanh thu (đơn đã giao)</span>
            <strong>{summary.revenue.toLocaleString("vi-VN")} VNĐ</strong>
          </div>
        </div>
      )}

      <form className="admin-search" onSubmit={handleTimKiem}>
        <input
          type="text"
          placeholder="Tìm theo mã đơn, tên người nhận, số điện thoại..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="book-buy-btn">Tìm</button>
      </form>

      <div className="category-list">
        {cacTab.map(([ma, ten]) => (
          <button
            key={ma}
            type="button"
            className={`category-item ${status === ma ? "selected" : ""}`}
            onClick={() => handleChonTab(ma)}
          >
            {ten}{summary && ma ? ` (${summary.counts[ma]})` : ""}
          </button>
        ))}
      </div>

      {loading && <p>Đang tải...</p>}
      {loi && <p className="cart-message cart-message--loi">{loi}</p>}
      {!loading && !loi && <p className="shop-count">Tìm thấy {total} đơn</p>}

      {!loading && !loi && orders.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã</th><th>Ngày đặt</th><th>Người nhận</th><th>Điện thoại</th>
                <th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>{dinhDangNgay(o.createdAt)}</td>
                  <td>{o.receiverName}</td>
                  <td>{o.phone}</td>
                  <td>{o.total.toLocaleString("vi-VN")} VNĐ</td>
                  <td>
                    {o.paymentMethod}{" "}
                    <span className={`status-badge status-${o.paymentStatus}`}>
                      {TRANG_THAI_THANH_TOAN[o.paymentStatus]}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${o.status}`}>{TRANG_THAI_DON[o.status]}</span>
                  </td>
                  <td>
                    <button type="button" className="admin-view-btn" onClick={() => setDangXem(o.id)}>
                      Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} type="button" className={p === page ? "selected" : ""} onClick={() => setPage(p)}>
              {p}
            </button>
          ))}
          <button type="button" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Sau</button>
        </div>
      )}

      {dangXem && (
        <ChiTietDonAdmin id={dangXem} onClose={() => setDangXem(null)} onChanged={handleDaThayDoi} />
      )}
    </div>
  );
}

export default QuanTriDonHang;