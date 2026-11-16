import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import QuanTriMenu from "../components/QuanTriMenu";
import PhanTrang from "../components/PhanTrang";
import {
  getAdminReturns, approveReturn, rejectReturn, completeReturn,
  getAdminRefunds, completeRefund,
} from "../api/adminApi";
import {
  TRANG_THAI_DOI_TRA, LOAI_DOI_TRA, TRANG_THAI_HOAN_TIEN, LY_DO_HOAN_TIEN, dinhDangNgay, layLoi,
} from "../utils/trangthai";
import { useThongBao } from "../context/thongBaoContext";

const LIMIT = 10;

// ===== Hộp thoại: đã nhận hàng trả về =====
function HoanTatNhanHang({ yc, onClose, onDone }) {
  const [tinhTrang, setTinhTrang] = useState("tot"); // "tot" = nhập lại kho, "hong" = không nhập
  const [ghiChu, setGhiChu] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState(null);

  const handleGui = async () => {
    setDangGui(true);
    setLoi(null);
    try {
      const res = await completeReturn(yc.id, { restock: tinhTrang === "tot", note: ghiChu });
      onDone(res.data.message);
      onClose();
    } catch (err) {
      setLoi(layLoi(err));
    } finally {
      setDangGui(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !dangGui) onClose(); }}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>Nhận hàng trả — Yêu cầu #{yc.id}</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p>{yc.tomTat}</p>
        <div className="checkout-field">
          <label>Tình trạng hàng nhận về</label>
          <select className="admin-select" value={tinhTrang} onChange={(e) => setTinhTrang(e.target.value)}>
            <option value="tot">Còn nguyên vẹn, nhập lại kho để bán</option>
            <option value="hong">Bị hỏng, không nhập lại kho</option>
          </select>
        </div>
        <p className="admin-hint">
          {yc.type === "exchange"
            ? "Hệ thống sẽ trừ kho số quyển mới để gửi đổi cho khách. Nếu kho không đủ thì thao tác bị từ chối."
            : "Hệ thống sẽ tạo khoản hoàn tiền ở tab Hoàn tiền để bạn chuyển khoản cho khách."}
        </p>
        <div className="checkout-field">
          <label>Ghi chú (không bắt buộc)</label>
          <input value={ghiChu} maxLength={500} onChange={(e) => setGhiChu(e.target.value)} />
        </div>
        {loi && <p className="cart-message cart-message--loi">{loi}</p>}
        <div className="modal-actions">
          <button type="button" className="book-buy-btn" onClick={handleGui} disabled={dangGui}>
            {dangGui ? "Đang lưu..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuanTriDoiTra() {
  const { hoiXacNhan, hoiNhap } = useThongBao();
  const [tab, setTab] = useState("returns"); // "returns" | "refunds"
  const [status, setStatus] = useState("");
  const [ds, setDs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState(null);
  const [thongBao, setThongBao] = useState(null);
  const [dangNhanHang, setDangNhanHang] = useState(null); // yêu cầu đang mở hộp thoại nhận hàng

  const tai = useCallback(() => {
    setLoading(true);
    setLoi(null);
    const goi = tab === "returns" ? getAdminReturns : getAdminRefunds;
    goi({ status: status || undefined, page, limit: LIMIT })
      .then((res) => {
        setDs(res.data.data);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.total);
      })
      .catch((err) => setLoi(err.response?.status === 403 ? "Bạn không có quyền quản trị" : layLoi(err)))
      .finally(() => setLoading(false));
  }, [tab, status, page]);

  useEffect(() => { tai(); }, [tai]);

  const doiTab = (t) => {
    setTab(t);
    setStatus("");
    setPage(1);
    setThongBao(null);
    setDs([]);          // xóa dữ liệu của tab cũ ngay, để không vẽ nhầm
    setLoading(true);   // báo "đang tải" ngay trong lần vẽ này
  };
  const doiLoc = (s) => { setStatus(s); setPage(1); };

  // Chạy 1 hành động rồi báo kết quả và tải lại danh sách
  const chay = async (hanhDong) => {
    setThongBao(null);
    try {
      const res = await hanhDong();
      setThongBao({ loai: "thanh-cong", noiDung: res.data.message });
      tai();
    } catch (err) {
      setThongBao({ loai: "loi", noiDung: layLoi(err) });
    }
  };

  const handleDuyet = async (yc) => {
    if (!(await hoiXacNhan(`Duyệt yêu cầu #${yc.id}? Khách sẽ được báo gửi hàng về cho cửa hàng.`))) return;
    chay(() => approveReturn(yc.id, ""));
  };
  const handleTuChoi = async (yc) => {
    const ly = await hoiNhap("Nhập lý do từ chối (khách sẽ nhìn thấy):");
    if (!ly || !ly.trim()) return;
    chay(() => rejectReturn(yc.id, ly));
  };
  const handleDaHoanTien = async (f) => {
    const ghiChu = await hoiNhap(`Đã chuyển ${f.amount.toLocaleString("vi-VN")} VNĐ cho khách? Nhập mã giao dịch (có thể để trống):`);
    if (ghiChu === null) return; // bấm Hủy
    chay(() => completeRefund(f.id, ghiChu));
  };

  const locDoiTra = [["", "Tất cả"], ...Object.entries(TRANG_THAI_DOI_TRA)];
  const locHoanTien = [["", "Tất cả"], ...Object.entries(TRANG_THAI_HOAN_TIEN)];

  return (
    <div className="admin-page">
      <h2 className="orders-page__title">Đổi trả và hoàn tiền</h2>
      <QuanTriMenu />

      <div className="category-list">
        <button type="button" className={`category-item ${tab === "returns" ? "selected" : ""}`} onClick={() => doiTab("returns")}>
          Yêu cầu đổi trả
        </button>
        <button type="button" className={`category-item ${tab === "refunds" ? "selected" : ""}`} onClick={() => doiTab("refunds")}>
          Hoàn tiền
        </button>
      </div>
      <div className="category-list">
        {(tab === "returns" ? locDoiTra : locHoanTien).map(([ma, ten]) => (
          <button key={ma} type="button" className={`category-item ${status === ma ? "selected" : ""}`} onClick={() => doiLoc(ma)}>
            {ten}
          </button>
        ))}
      </div>

      {thongBao && <p className={`cart-message cart-message--${thongBao.loai}`}>{thongBao.noiDung}</p>}
      {loading && <p>Đang tải...</p>}
      {loi && <p className="cart-message cart-message--loi">{loi}</p>}
      {!loading && !loi && <p className="shop-count">Tìm thấy {total} bản ghi</p>}

      {/* ===== Tab Yêu cầu đổi trả ===== */}
      {tab === "returns" && !loading && ds.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Mã</th><th>Đơn</th><th>Khách</th><th>Loại</th><th>Sản phẩm</th><th>Lý do</th><th>Trạng thái</th><th></th></tr>
            </thead>
            <tbody>
              {ds.map((yc) => (
                <tr key={yc.id}>
                  <td>#{yc.id}<br /><span className="admin-hint">{dinhDangNgay(yc.createdAt)}</span></td>
                  <td><Link to="/admin/orders">#{yc.orderId}</Link></td>
                  <td>{yc.customerName}<br /><span className="admin-hint">{yc.customerEmail}</span></td>
                  <td>{LOAI_DOI_TRA[yc.type]}</td>
                  <td className="review-cell">{yc.tomTat}</td>
                  <td className="review-cell">
                    {yc.reason}
                    {yc.refundInfo && <span className="admin-hint">Nhận tiền: {yc.refundInfo}</span>}
                    {yc.adminNote && <span className="admin-hint">Phản hồi: {yc.adminNote}</span>}
                  </td>
                  <td><span className={`status-badge status-${yc.status}`}>{TRANG_THAI_DOI_TRA[yc.status]}</span></td>
                  <td className="admin-row-actions">
                    {yc.status === "requested" && (
                      <>
                        <button type="button" className="admin-view-btn" onClick={() => handleDuyet(yc)}>Duyệt</button>
                        <button type="button" className="admin-view-btn" onClick={() => handleTuChoi(yc)}>Từ chối</button>
                      </>
                    )}
                    {yc.status === "approved" && (
                      <>
                        <button type="button" className="admin-view-btn" onClick={() => setDangNhanHang(yc)}>Đã nhận hàng trả</button>
                        <button type="button" className="admin-view-btn" onClick={() => handleTuChoi(yc)}>Từ chối</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== Tab Hoàn tiền ===== */}
      {tab === "refunds" && !loading && ds.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Mã</th><th>Đơn</th><th>Khách</th><th>Số tiền</th><th>Nguồn</th><th>Thông tin nhận tiền</th><th>Trạng thái</th><th></th></tr>
            </thead>
            <tbody>
              {ds.map((f) => (
                <tr key={f.id}>
                  <td>#{f.id}<br /><span className="admin-hint">{dinhDangNgay(f.createdAt)}</span></td>
                  <td><Link to="/admin/orders">#{f.orderId}</Link></td>
                  <td>{f.customerName}<br /><span className="admin-hint">{f.customerEmail}</span></td>
                  <td><strong>{f.amount.toLocaleString("vi-VN")} VNĐ</strong></td>
                  <td>{LY_DO_HOAN_TIEN[f.reason]}{f.returnId ? ` (yêu cầu #${f.returnId})` : ""}</td>
                  <td className="review-cell">
                    {f.refundInfo || "Liên hệ khách để lấy thông tin"}
                    {f.note && <span className="admin-hint">Ghi chú: {f.note}</span>}
                  </td>
                  <td>
                    <span className={`status-badge status-${f.status}`}>{TRANG_THAI_HOAN_TIEN[f.status]}</span>
                    {f.completedAt && <span className="admin-hint">{dinhDangNgay(f.completedAt)}</span>}
                  </td>
                  <td>
                    {f.status === "pending" && (
                      <button type="button" className="admin-view-btn" onClick={() => handleDaHoanTien(f)}>Đã hoàn tiền</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PhanTrang page={page} totalPages={totalPages} onChange={setPage} />

      {dangNhanHang && (
        <HoanTatNhanHang
          yc={dangNhanHang}
          onClose={() => setDangNhanHang(null)}
          onDone={(noiDung) => { setThongBao({ loai: "thanh-cong", noiDung }); tai(); }}
        />
      )}
    </div>
  );
}

export default QuanTriDoiTra;