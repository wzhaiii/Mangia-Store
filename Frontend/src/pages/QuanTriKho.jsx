import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import QuanTriMenu from "../components/QuanTriMenu";
import PhanTrang from "../components/PhanTrang";
import { getStockVolumes, getStockMovements, adjustStock } from "../api/adminApi";
import { LY_DO_KHO, dinhDangNgay, layLoi } from "../utils/trangthai";

const LIMIT = 15;

// ===== Hộp thoại nhập kho / điều chỉnh 1 tập =====
function FormKho({ tap, onClose, onDone }) {
  const [loai, setLoai] = useState("import"); // import | damaged | adjust
  const [soLuong, setSoLuong] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState(null);

  const handleGui = async () => {
    setLoi(null);
    const n = Number(soLuong);
    if (!Number.isInteger(n) || n === 0) {
      setLoi("Số lượng phải là số nguyên khác 0");
      return;
    }
    if (loai !== "adjust" && n < 0) {
      setLoi("Với loại này hãy nhập số dương, hệ thống tự hiểu là cộng hay trừ");
      return;
    }
    if (loai !== "import" && !ghiChu.trim()) {
      setLoi("Vui lòng ghi chú lý do");
      return;
    }
    // Nhập kho: cộng. Hỏng/mất: trừ. Điều chỉnh: giữ nguyên dấu người dùng gõ
    const change = loai === "import" ? n : loai === "damaged" ? -n : n;
    setDangGui(true);
    try {
      await adjustStock({ volumeId: tap.volumeId, change, reason: loai, note: ghiChu });
      onDone();
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
          <h3>{tap.title} — Tập {tap.volumeNo}</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p>Tồn kho hiện tại: <strong>{tap.stock}</strong> quyển</p>
        <div className="checkout-field">
          <label>Loại thay đổi</label>
          <select className="admin-select" value={loai} onChange={(e) => setLoai(e.target.value)}>
            <option value="import">Nhập kho (cộng thêm)</option>
            <option value="damaged">Hỏng / mất (trừ đi)</option>
            <option value="adjust">Điều chỉnh sau kiểm kê (cộng hoặc trừ)</option>
          </select>
        </div>
        <div className="checkout-field">
          <label>{loai === "adjust" ? "Số lượng thay đổi (ví dụ 5 hoặc -3)" : "Số lượng (quyển)"}</label>
          <input type="number" value={soLuong} onChange={(e) => setSoLuong(e.target.value)} />
        </div>
        <div className="checkout-field">
          <label>Ghi chú {loai === "import" ? "(không bắt buộc)" : "*"}</label>
          <input value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} maxLength={255} />
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

function QuanTriKho() {
  const [tab, setTab] = useState("stock"); // "stock" | "history"
  const [thongBao, setThongBao] = useState(null);
  const [dangNhap, setDangNhap] = useState(null); // tập đang mở hộp thoại nhập kho

  // ----- Tab Tồn kho -----
  const [tapList, setTapList] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [chiSapHet, setChiSapHet] = useState(false);
  const [nguong, setNguong] = useState(5);
  const [pageA, setPageA] = useState(1);
  const [totalPagesA, setTotalPagesA] = useState(1);
  const [loadingA, setLoadingA] = useState(true);
  const [loiA, setLoiA] = useState(null);

  // ----- Tab Lịch sử -----
  const [lichSu, setLichSu] = useState([]);
  const [locTap, setLocTap] = useState(null); // { volumeId, ten } khi chỉ xem lịch sử 1 tập
  const [pageB, setPageB] = useState(1);
  const [totalPagesB, setTotalPagesB] = useState(1);
  const [loadingB, setLoadingB] = useState(false);
  const [loiB, setLoiB] = useState(null);

  const taiTon = useCallback(() => {
    setLoadingA(true);
    setLoiA(null);
    getStockVolumes({ search: search || undefined, low: chiSapHet ? 1 : undefined, page: pageA, limit: LIMIT })
      .then((res) => {
        setTapList(res.data.data);
        setTotalPagesA(res.data.totalPages);
        setNguong(res.data.nguongSapHet);
      })
      .catch((err) => setLoiA(err.response?.status === 403 ? "Bạn không có quyền quản trị" : layLoi(err)))
      .finally(() => setLoadingA(false));
  }, [search, chiSapHet, pageA]);

  const taiLichSu = useCallback(() => {
    setLoadingB(true);
    setLoiB(null);
    getStockMovements({ volumeId: locTap?.volumeId, page: pageB, limit: LIMIT })
      .then((res) => {
        setLichSu(res.data.data);
        setTotalPagesB(res.data.totalPages);
      })
      .catch((err) => setLoiB(layLoi(err)))
      .finally(() => setLoadingB(false));
  }, [locTap, pageB]);

  useEffect(() => { taiTon(); }, [taiTon]);
  useEffect(() => { if (tab === "history") taiLichSu(); }, [tab, taiLichSu]);

  const handleTimKiem = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPageA(1);
  };

  const xemLichSuTap = (t) => {
    setLocTap({ volumeId: t.volumeId, ten: `${t.title} — Tập ${t.volumeNo}` });
    setPageB(1);
    setTab("history");
  };

  const handleXongNhapKho = () => {
    setThongBao({ loai: "thanh-cong", noiDung: "Đã cập nhật tồn kho" });
    taiTon();
    if (tab === "history") taiLichSu();
  };

  return (
    <div className="admin-page">
      <h2 className="orders-page__title">Quản trị kho</h2>
      <QuanTriMenu />

      <div className="category-list">
        <button type="button" className={`category-item ${tab === "stock" ? "selected" : ""}`} onClick={() => setTab("stock")}>
          Tồn kho
        </button>
        <button
          type="button" className={`category-item ${tab === "history" ? "selected" : ""}`}
          onClick={() => { setLocTap(null); setPageB(1); setTab("history"); }}
        >
          Lịch sử kho
        </button>
      </div>

      {thongBao && <p className={`cart-message cart-message--${thongBao.loai}`}>{thongBao.noiDung}</p>}

      {/* ===== Tab Tồn kho ===== */}
      {tab === "stock" && (
        <>
          <div className="admin-toolbar">
            <form className="admin-search" onSubmit={handleTimKiem}>
              <input
                type="text" placeholder="Tìm theo tên truyện..."
                value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="book-buy-btn">Tìm</button>
            </form>
            <label className="admin-check">
              <input
                type="checkbox" checked={chiSapHet}
                onChange={(e) => { setChiSapHet(e.target.checked); setPageA(1); }}
              />
              Chỉ hiện tập sắp hết (≤ {nguong} quyển)
            </label>
          </div>

          {loadingA && <p>Đang tải...</p>}
          {loiA && <p className="cart-message cart-message--loi">{loiA}</p>}
          {!loadingA && !loiA && tapList.length === 0 && <p className="shop-count">Không có tập nào phù hợp.</p>}
          {!loadingA && tapList.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Truyện</th><th>Tập</th><th>Tồn kho</th><th>Trạng thái</th><th></th></tr></thead>
                <tbody>
                  {tapList.map((t) => (
                    <tr key={t.volumeId}>
                      <td>{t.title}</td>
                      <td>Tập {t.volumeNo}</td>
                      <td>
                        <strong className={t.stock <= nguong ? "stock-low" : ""}>{t.stock}</strong>
                      </td>
                      <td>
                        <span className={`status-badge ${t.isActive ? "status-delivered" : "status-cancelled"}`}>
                          {t.isActive ? "Đang bán" : "Đã ẩn"}
                        </span>
                      </td>
                      <td className="admin-row-actions">
                        <button type="button" className="admin-view-btn" onClick={() => setDangNhap(t)}>Nhập / điều chỉnh</button>
                        <button type="button" className="admin-view-btn" onClick={() => xemLichSuTap(t)}>Lịch sử</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <PhanTrang page={pageA} totalPages={totalPagesA} onChange={setPageA} />
        </>
      )}

      {/* ===== Tab Lịch sử kho ===== */}
      {tab === "history" && (
        <>
          {locTap && (
            <p className="shop-count">
              Đang xem lịch sử của: <strong>{locTap.ten}</strong>{" "}
              <button type="button" className="admin-view-btn" onClick={() => { setLocTap(null); setPageB(1); }}>
                Xem tất cả
              </button>
            </p>
          )}
          {loadingB && <p>Đang tải...</p>}
          {loiB && <p className="cart-message cart-message--loi">{loiB}</p>}
          {!loadingB && !loiB && lichSu.length === 0 && <p className="shop-count">Chưa có biến động kho nào.</p>}
          {!loadingB && lichSu.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Thời gian</th><th>Truyện</th><th>Thay đổi</th><th>Tồn sau</th><th>Lý do</th><th>Người thực hiện</th><th>Ghi chú</th></tr>
                </thead>
                <tbody>
                  {lichSu.map((m) => (
                    <tr key={m.id}>
                      <td>{dinhDangNgay(m.createdAt)}</td>
                      <td>{m.title} — Tập {m.volumeNo}</td>
                      <td>
                        <strong className={m.quantityChange > 0 ? "stock-up" : "stock-down"}>
                          {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                        </strong>
                      </td>
                      <td>{m.stockAfter}</td>
                      <td>
                        {LY_DO_KHO[m.reason] || m.reason}
                        {m.orderId && <> (đơn <Link to="/admin/orders">#{m.orderId}</Link>)</>}
                      </td>
                      <td>{m.createdByName || "—"}</td>
                      <td>{m.note || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <PhanTrang page={pageB} totalPages={totalPagesB} onChange={setPageB} />
        </>
      )}

      {dangNhap && (
        <FormKho tap={dangNhap} onClose={() => setDangNhap(null)} onDone={handleXongNhapKho} />
      )}
    </div>
  );
}

export default QuanTriKho;