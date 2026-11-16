import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import QuanTriMenu from "../components/QuanTriMenu";
import PhanTrang from "../components/PhanTrang";
import { getAdminReviews, setReviewVisible } from "../api/adminApi";
import { dinhDangNgay, layLoi } from "../utils/trangthai";
import { useThongBao } from "../context/thongBaoContext";
const LIMIT = 10;

function QuanTriDanhGia() {
  const [ds, setDs] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(""); // "" = tất cả, "1" = đang hiện, "0" = đang ẩn
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState(null);
  const [thongBao, setThongBao] = useState(null);
  const [dangXuLy, setDangXuLy] = useState(null); // id đánh giá đang được ẩn/hiện
  const { hoiXacNhan } = useThongBao();
  
  const tai = useCallback(() => {
    setLoading(true);
    setLoi(null);
    getAdminReviews({ search: search || undefined, visible: visible || undefined, page, limit: LIMIT })
      .then((res) => {
        setDs(res.data.data);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.total);
      })
      .catch((err) => setLoi(err.response?.status === 403 ? "Bạn không có quyền quản trị" : layLoi(err)))
      .finally(() => setLoading(false));
  }, [search, visible, page]);

  useEffect(() => { tai(); }, [tai]);

  const handleTimKiem = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleDoiTrangThai = async (r) => {
    const hienTai = r.isVisible;
    if (hienTai && !(await hoiXacNhan("Ẩn đánh giá này khỏi trang sản phẩm?"))) return;
    setDangXuLy(r.id);
    setThongBao(null);
    try {
      const res = await setReviewVisible(r.id, !hienTai);
      setThongBao({ loai: "thanh-cong", noiDung: res.data.message });
      await tai();
    } catch (err) {
      setThongBao({ loai: "loi", noiDung: layLoi(err) });
    } finally {
      setDangXuLy(null);
    }
  };

  return (
    <div className="admin-page">
      <h2 className="orders-page__title">Quản trị đánh giá</h2>
      <QuanTriMenu />

      <form className="admin-search" onSubmit={handleTimKiem}>
        <input
          type="text" placeholder="Tìm theo tên truyện, người đánh giá, email, nội dung..."
          value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="book-buy-btn">Tìm</button>
      </form>

      <div className="category-list">
        {[["", "Tất cả"], ["1", "Đang hiện"], ["0", "Đang ẩn"]].map(([ma, ten]) => (
          <button
            key={ma} type="button"
            className={`category-item ${visible === ma ? "selected" : ""}`}
            onClick={() => { setVisible(ma); setPage(1); }}
          >{ten}</button>
        ))}
      </div>

      {thongBao && <p className={`cart-message cart-message--${thongBao.loai}`}>{thongBao.noiDung}</p>}
      {loading && <p>Đang tải...</p>}
      {loi && <p className="cart-message cart-message--loi">{loi}</p>}
      {!loading && !loi && <p className="shop-count">Tìm thấy {total} đánh giá</p>}

      {!loading && ds.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Mã</th><th>Truyện</th><th>Người đánh giá</th><th>Sao</th><th>Nội dung</th><th>Ngày</th><th>Trạng thái</th><th></th></tr>
            </thead>
            <tbody>
              {ds.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td><Link to={`/books/${r.bookId}`}>{r.bookTitle}</Link></td>
                  <td>{r.userName}<br /><span className="admin-hint">{r.userEmail}</span></td>
                  <td>{r.rating} ★</td>
                  <td className="review-cell">{r.comment || "—"}</td>
                  <td>{dinhDangNgay(r.createdAt)}</td>
                  <td>
                    <span className={`status-badge ${r.isVisible ? "status-delivered" : "status-cancelled"}`}>
                      {r.isVisible ? "Đang hiện" : "Đã ẩn"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button" className="admin-view-btn"
                      disabled={dangXuLy === r.id}
                      onClick={() => handleDoiTrangThai(r)}
                    >{r.isVisible ? "Ẩn" : "Hiện"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <PhanTrang page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

export default QuanTriDanhGia;