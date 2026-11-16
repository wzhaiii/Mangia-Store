import { useEffect, useState, useCallback } from "react";
import QuanTriMenu from "../components/QuanTriMenu";
import { getAdminReport } from "../api/adminApi";
import { layLoi } from "../utils/trangthai";

// Đổi 1 ngày thành chuỗi yyyy-mm-dd theo GIỜ MÁY (tránh lệch múi giờ khi dùng toISOString)
const dinhDangISO = (d) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
const ngayTruoc = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dinhDangISO(d);
};
const tien = (n) => Number(n).toLocaleString("vi-VN") + " VNĐ";

function QuanTriBaoCao() {
  const [tu, setTu] = useState(ngayTruoc(29));
  const [den, setDen] = useState(dinhDangISO(new Date()));
  const [groupBy, setGroupBy] = useState("day"); // "day" | "month"
  const [bc, setBc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState(null);

  const tai = useCallback(() => {
    if (tu > den) {
      setLoi("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc");
      return;
    }
    setLoading(true);
    setLoi(null);
    getAdminReport({ from: tu, to: den, groupBy })
      .then((res) => setBc(res.data))
      .catch((err) => setLoi(err.response?.status === 403 ? "Bạn không có quyền quản trị" : layLoi(err)))
      .finally(() => setLoading(false));
  }, [tu, den, groupBy]);

  // Chỉ tự tải 1 lần khi mở trang. Sau đó người dùng bấm nút "Xem báo cáo" để tải lại
  useEffect(() => { tai(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doanhThuLonNhat = bc ? Math.max(1, ...bc.doanhThu.map((r) => r.doanhThu)) : 1;

  return (
    <div className="admin-page">
      <h2 className="orders-page__title">Báo cáo doanh thu</h2>
      <QuanTriMenu />

      <div className="report-filter">
        <label>Từ ngày <input type="date" value={tu} onChange={(e) => setTu(e.target.value)} /></label>
        <label>Đến ngày <input type="date" value={den} onChange={(e) => setDen(e.target.value)} /></label>
        <label>
          Gom theo{" "}
          <select className="admin-select" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            <option value="day">Ngày</option>
            <option value="month">Tháng</option>
          </select>
        </label>
        <button type="button" className="book-buy-btn" onClick={tai} disabled={loading}>Xem báo cáo</button>
      </div>

      {loading && <p>Đang tải...</p>}
      {loi && <p className="cart-message cart-message--loi">{loi}</p>}

      {bc && !loading && (
        <>
          <div className="admin-stats">
            <div className="admin-stat"><span>Doanh thu (đơn đã giao)</span><strong>{tien(bc.tongQuan.doanhThu)}</strong></div>
            <div className="admin-stat"><span>Đã hoàn tiền (trả hàng)</span><strong>{tien(bc.tongQuan.hoanTien)}</strong></div>
            <div className="admin-stat"><span>Doanh thu thực</span><strong>{tien(bc.tongQuan.doanhThu - bc.tongQuan.hoanTien)}</strong></div>
            <div className="admin-stat"><span>Tổng số đơn đặt</span><strong>{bc.tongQuan.tongDon}</strong></div>
            <div className="admin-stat"><span>Đơn đã giao</span><strong>{bc.tongQuan.donDaGiao}</strong></div>
            <div className="admin-stat">
              <span>Đơn bị hủy</span>
              <strong>{bc.tongQuan.donHuy} ({(bc.tongQuan.tyLeHuy * 100).toFixed(1)}%)</strong>
            </div>
          </div>

          <h3 className="report-title">Doanh thu theo {bc.groupBy === "month" ? "tháng" : "ngày"}</h3>
          {bc.doanhThu.length === 0 ? (
            <p className="shop-count">Chưa có đơn đã giao trong khoảng này.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>{bc.groupBy === "month" ? "Tháng" : "Ngày"}</th><th>Số đơn</th><th>Doanh thu</th><th className="report-bar-col"></th></tr></thead>
                <tbody>
                  {bc.doanhThu.map((r) => (
                    <tr key={r.ky}>
                      <td>{r.ky}</td>
                      <td>{r.soDon}</td>
                      <td>{tien(r.doanhThu)}</td>
                      <td>
                        <div className="report-bar" style={{ width: `${(r.doanhThu / doanhThuLonNhat) * 100}%` }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="report-two-cols">
            <div>
              <h3 className="report-title">Truyện bán chạy nhất</h3>
              {bc.banChay.length === 0 ? <p className="shop-count">Chưa có dữ liệu.</p> : (
                <table className="admin-table">
                  <thead><tr><th>#</th><th>Truyện</th><th>Số quyển</th><th>Doanh thu</th></tr></thead>
                  <tbody>
                    {bc.banChay.map((r, i) => (
                      <tr key={r.bookId}><td>{i + 1}</td><td>{r.title}</td><td>{r.soQuyen}</td><td>{tien(r.doanhThu)}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div>
              <h3 className="report-title">Truyện bị hủy nhiều nhất</h3>
              {bc.biHuy.length === 0 ? <p className="shop-count">Không có đơn nào bị hủy.</p> : (
                <table className="admin-table">
                  <thead><tr><th>#</th><th>Truyện</th><th>Số quyển</th><th>Số đơn</th></tr></thead>
                  <tbody>
                    {bc.biHuy.map((r, i) => (
                      <tr key={r.bookId}><td>{i + 1}</td><td>{r.title}</td><td>{r.soQuyen}</td><td>{r.soDon}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <p className="admin-hint">Doanh thu và sách bán chạy chỉ tính các đơn đã giao; ngày được tính theo ngày đặt hàng.</p>
        </>
      )}
    </div>
  );
}

export default QuanTriBaoCao;