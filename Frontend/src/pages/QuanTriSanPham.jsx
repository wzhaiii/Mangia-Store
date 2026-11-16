import { useEffect, useState, useCallback } from "react";
import QuanTriMenu from "../components/QuanTriMenu";
import PhanTrang from "../components/PhanTrang";
import {
  getAdminCategories, createCategory, updateCategory,
  getAdminBooks, getAdminBookDetail, createBook, updateBook,
  createVolume, updateVolume,} from "../api/adminApi";
import { layLoi } from "../utils/trangthai";
import { useThongBao } from "../context/thongBaoContext";
const LIMIT = 10;

// Nhãn "Đang bán / Đã ẩn" dùng lại màu của status-badge có sẵn
const NhanTrangThai = ({ dangBan }) => (
  <span className={`status-badge ${dangBan ? "status-delivered" : "status-cancelled"}`}>
    {dangBan ? "Đang bán" : "Đã ẩn"}
  </span>
);

// ===== Hộp thoại thêm / sửa 1 bộ truyện =====
function FormTruyen({ truyen, theLoai, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: truyen?.title || "",
    author: truyen?.author || "",
    categoryId: truyen?.categoryId || "",
    price: truyen?.price ?? "",
    imageUrl: truyen?.imageUrl || "",
    descrip: "",
  });
  const [loi, setLoi] = useState(null);
  const [dangLuu, setDangLuu] = useState(false);

  // Khi sửa: danh sách chưa có phần mô tả nên tải thêm chi tiết
  useEffect(() => {
    if (!truyen) return;
    getAdminBookDetail(truyen.id)
      .then((res) => setForm((f) => ({ ...f, descrip: res.data.descrip || "" })))
      .catch(() => {});
  }, [truyen]);

  const handleDoi = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLuu = async () => {
    setLoi(null);
    if (!form.title.trim() || !form.author.trim() || !form.categoryId || form.price === "") {
      setLoi("Vui lòng nhập đủ tên, tác giả, thể loại và giá");
      return;
    }
    if (Number(form.price) < 0) {
      setLoi("Giá không được âm");
      return;
    }
    setDangLuu(true);
    try {
      const data = { ...form, categoryId: Number(form.categoryId), price: Number(form.price) };
      if (truyen) await updateBook(truyen.id, data);
      else await createBook(data);
      onSaved();
      onClose();
    } catch (err) {
      setLoi(layLoi(err));
    } finally {
      setDangLuu(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !dangLuu) onClose(); }}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>{truyen ? `Sửa truyện #${truyen.id}` : "Thêm truyện mới"}</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="checkout-field">
          <label>Tên truyện *</label>
          <input name="title" value={form.title} onChange={handleDoi} />
        </div>
        <div className="checkout-field">
          <label>Tác giả *</label>
          <input name="author" value={form.author} onChange={handleDoi} />
        </div>
        <div className="checkout-row">
          <div className="checkout-field">
            <label>Thể loại *</label>
            <select name="categoryId" value={form.categoryId} onChange={handleDoi} className="admin-select">
              <option value="">-- Chọn --</option>
              {theLoai.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.isActive ? "" : " (ẩn)"}</option>
              ))}
            </select>
          </div>
          <div className="checkout-field">
            <label>Giá mỗi tập (VNĐ) *</label>
            <input name="price" type="number" min="0" value={form.price} onChange={handleDoi} />
          </div>
        </div>
        <div className="checkout-field">
          <label>Đường dẫn ảnh bìa</label>
          <input name="imageUrl" value={form.imageUrl} onChange={handleDoi} placeholder="/uploads/books/ten-anh.jpg" />
          <small className="admin-hint">Chép ảnh vào thư mục uploads/books của server, rồi nhập đường dẫn bắt đầu bằng /uploads/</small>
        </div>
        <div className="checkout-field">
          <label>Mô tả</label>
          <textarea name="descrip" rows="4" value={form.descrip} onChange={handleDoi} />
        </div>
        {loi && <p className="cart-message cart-message--loi">{loi}</p>}
        <div className="modal-actions">
          <button type="button" className="book-buy-btn" onClick={handleLuu} disabled={dangLuu}>
            {dangLuu ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Hộp thoại quản lý các tập của 1 bộ truyện =====
function QuanLyTap({ truyen, onClose, onChanged }) {
  const [sach, setSach] = useState(null);
  const [thongBao, setThongBao] = useState(null);
  const [dangXuLy, setDangXuLy] = useState(false);
  const [moi, setMoi] = useState({ volumeNo: "", imageUrl: "" });
  const [dangSua, setDangSua] = useState(null); // { id, volumeNo, imageUrl } của tập đang sửa

  const tai = useCallback(() => {
    return getAdminBookDetail(truyen.id)
      .then((res) => setSach(res.data))
      .catch((err) => setThongBao({ loai: "loi", noiDung: layLoi(err) }));
  }, [truyen.id]);

  useEffect(() => { tai(); }, [tai]);

  // Chạy 1 hành động rồi tải lại danh sách tập
  const chay = async (hanhDong) => {
    setDangXuLy(true);
    setThongBao(null);
    try {
      const res = await hanhDong();
      setThongBao({ loai: "thanh-cong", noiDung: res.data.message });
      await tai();
      onChanged();
      return true;
    } catch (err) {
      setThongBao({ loai: "loi", noiDung: layLoi(err) });
      return false;
    } finally {
      setDangXuLy(false);
    }
  };

  const handleThem = async () => {
    const ok = await chay(() => createVolume(truyen.id, { volumeNo: Number(moi.volumeNo), imageUrl: moi.imageUrl }));
    if (ok) setMoi({ volumeNo: "", imageUrl: "" });
  };

  const handleLuuSua = async () => {
    const ok = await chay(() =>
      updateVolume(dangSua.id, { volumeNo: Number(dangSua.volumeNo), imageUrl: dangSua.imageUrl })
    );
    if (ok) setDangSua(null);
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box modal-box--wide">
        <div className="modal-header">
          <h3>Các tập của: {truyen.title}</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        {!sach && <p>Đang tải...</p>}
        {sach && (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Tập</th><th>Tồn kho</th><th>Đường dẫn ảnh</th><th>Trạng thái</th><th></th></tr>
                </thead>
                <tbody>
                  {sach.volumes.length === 0 && (
                    <tr><td colSpan="5">Chưa có tập nào.</td></tr>
                  )}
                  {sach.volumes.map((v) => {
                    const dongNaySua = dangSua?.id === v.id;
                    return (
                      <tr key={v.id}>
                        <td>
                          {dongNaySua ? (
                            <input
                              type="number" min="1" className="admin-input-small"
                              value={dangSua.volumeNo}
                              onChange={(e) => setDangSua({ ...dangSua, volumeNo: e.target.value })}
                            />
                          ) : `Tập ${v.volumeNo}`}
                        </td>
                        <td>{v.stock}</td>
                        <td>
                          {dongNaySua ? (
                            <input
                              className="admin-input-wide"
                              value={dangSua.imageUrl}
                              onChange={(e) => setDangSua({ ...dangSua, imageUrl: e.target.value })}
                            />
                          ) : (v.imageUrl || "—")}
                        </td>
                        <td><NhanTrangThai dangBan={v.isActive} /></td>
                        <td className="admin-row-actions">
                          {dongNaySua ? (
                            <>
                              <button type="button" className="admin-view-btn" disabled={dangXuLy} onClick={handleLuuSua}>Lưu</button>
                              <button type="button" className="admin-view-btn" onClick={() => setDangSua(null)}>Hủy</button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button" className="admin-view-btn" disabled={dangXuLy}
                                onClick={() => setDangSua({ id: v.id, volumeNo: v.volumeNo, imageUrl: v.imageUrl || "" })}
                              >Sửa</button>
                              <button
                                type="button" className="admin-view-btn" disabled={dangXuLy}
                                onClick={() => chay(() => updateVolume(v.id, { isActive: !v.isActive }))}
                              >{v.isActive ? "Ẩn" : "Hiện"}</button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <h4>Thêm tập mới</h4>
            <div className="admin-inline-form">
              <input
                type="number" min="1" placeholder="Số tập" className="admin-input-small"
                value={moi.volumeNo} onChange={(e) => setMoi({ ...moi, volumeNo: e.target.value })}
              />
              <input
                placeholder="/uploads/books/anh-tap.jpg (không bắt buộc)" className="admin-input-wide"
                value={moi.imageUrl} onChange={(e) => setMoi({ ...moi, imageUrl: e.target.value })}
              />
              <button type="button" className="book-buy-btn" disabled={dangXuLy || !moi.volumeNo} onClick={handleThem}>
                Thêm
              </button>
            </div>
            <small className="admin-hint">Tập mới có tồn kho = 0. Muốn có hàng, vào trang Kho để nhập.</small>
          </>
        )}
        {thongBao && (
          <p className={`cart-message cart-message--${thongBao.loai}`}>{thongBao.noiDung}</p>
        )}
      </div>
    </div>
  );
}

// ===== Trang chính =====
function QuanTriSanPham() {
  const [tab, setTab] = useState("books"); // "books" | "categories"
  const { hoiXacNhan, hoiNhap } = useThongBao();
  const [theLoai, setTheLoai] = useState([]);
  const [truyen, setTruyen] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState(null);
  const [thongBao, setThongBao] = useState(null);
  const [formTruyen, setFormTruyen] = useState(undefined); // undefined = đóng, null = thêm mới, object = sửa
  const [xemTap, setXemTap] = useState(null);
  const [tenTheLoaiMoi, setTenTheLoaiMoi] = useState("");

  const taiTheLoai = useCallback(() => {
    getAdminCategories()
      .then((res) => setTheLoai(res.data))
      .catch((err) => setLoi(layLoi(err)));
  }, []);

  const taiTruyen = useCallback(() => {
    setLoading(true);
    setLoi(null);
    getAdminBooks({ search: search || undefined, page, limit: LIMIT })
      .then((res) => {
        setTruyen(res.data.data);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.total);
      })
      .catch((err) =>
        setLoi(err.response?.status === 403 ? "Bạn không có quyền quản trị" : layLoi(err))
      )
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { taiTheLoai(); }, [taiTheLoai]);
  useEffect(() => { taiTruyen(); }, [taiTruyen]);

  const handleTimKiem = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  // Chạy 1 hành động rồi báo kết quả và tải lại dữ liệu
  const chay = async (hanhDong, xacNhan) => {
    if (xacNhan && !(await hoiXacNhan(xacNhan))) return false;
    setThongBao(null);
    try {
      const res = await hanhDong();
      setThongBao({ loai: "thanh-cong", noiDung: res.data.message });
      taiTheLoai();
      taiTruyen();
      return true;
    } catch (err) {
      setThongBao({ loai: "loi", noiDung: layLoi(err) });
      return false;
    }
  };

  const handleThemTheLoai = async (e) => {
    e.preventDefault();
    const ok = await chay(() => createCategory({ name: tenTheLoaiMoi }));
    if (ok) setTenTheLoaiMoi("");
  };

  const handleDoiTenTheLoai = async (c) => {
  const ten = await hoiNhap("Nhập tên thể loại mới:", c.name);
  if (ten && ten.trim() && ten.trim() !== c.name) chay(() => updateCategory(c.id, { name: ten }));
};

  return (
    <div className="admin-page">
      <h2 className="orders-page__title">Quản trị sản phẩm</h2>
      <QuanTriMenu />

      <div className="category-list">
        <button type="button" className={`category-item ${tab === "books" ? "selected" : ""}`} onClick={() => setTab("books")}>
          Truyện
        </button>
        <button type="button" className={`category-item ${tab === "categories" ? "selected" : ""}`} onClick={() => setTab("categories")}>
          Thể loại
        </button>
      </div>

      {thongBao && <p className={`cart-message cart-message--${thongBao.loai}`}>{thongBao.noiDung}</p>}
      {loi && <p className="cart-message cart-message--loi">{loi}</p>}

      {/* ===== Tab Truyện ===== */}
      {tab === "books" && (
        <>
          <div className="admin-toolbar">
            <form className="admin-search" onSubmit={handleTimKiem}>
              <input
                type="text" placeholder="Tìm theo tên truyện hoặc tác giả..."
                value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="book-buy-btn">Tìm</button>
            </form>
            <button type="button" className="book-buy-btn" onClick={() => setFormTruyen(null)}>+ Thêm truyện</button>
          </div>

          {loading && <p>Đang tải...</p>}
          {!loading && !loi && <p className="shop-count">Có {total} bộ truyện</p>}

          {!loading && truyen.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Mã</th><th>Ảnh</th><th>Tên truyện</th><th>Tác giả</th><th>Thể loại</th><th>Giá</th><th>Số tập</th><th>Trạng thái</th><th></th></tr>
                </thead>
                <tbody>
                  {truyen.map((b) => (
                    <tr key={b.id}>
                      <td>#{b.id}</td>
                      <td>{b.image && <img className="admin-thumb" src={b.image} alt={b.title} />}</td>
                      <td>{b.title}</td>
                      <td>{b.author}</td>
                      <td>{b.category}</td>
                      <td>{b.price.toLocaleString("vi-VN")} VNĐ</td>
                      <td>{b.volumeCount}</td>
                      <td><NhanTrangThai dangBan={b.isActive} /></td>
                      <td className="admin-row-actions">
                        <button type="button" className="admin-view-btn" onClick={() => setFormTruyen(b)}>Sửa</button>
                        <button type="button" className="admin-view-btn" onClick={() => setXemTap(b)}>Các tập</button>
                        <button
                          type="button" className="admin-view-btn"
                          onClick={() =>
                            chay(
                              () => updateBook(b.id, { isActive: !b.isActive }),
                              b.isActive ? `Ẩn "${b.title}" khỏi cửa hàng? (không xóa dữ liệu, có thể hiện lại)` : null
                            )
                          }
                        >{b.isActive ? "Ẩn" : "Hiện"}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <PhanTrang page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {/* ===== Tab Thể loại ===== */}
      {tab === "categories" && (
        <>
          <form className="admin-search" onSubmit={handleThemTheLoai}>
            <input
              type="text" placeholder="Tên thể loại mới..."
              value={tenTheLoaiMoi} onChange={(e) => setTenTheLoaiMoi(e.target.value)}
            />
            <button type="submit" className="book-buy-btn" disabled={!tenTheLoaiMoi.trim()}>Thêm</button>
          </form>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Mã</th><th>Tên thể loại</th><th>Số truyện</th><th>Trạng thái</th><th></th></tr></thead>
              <tbody>
                {theLoai.map((c) => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td>{c.name}</td>
                    <td>{c.bookCount}</td>
                    <td><NhanTrangThai dangBan={c.isActive} /></td>
                    <td className="admin-row-actions">
                      <button type="button" className="admin-view-btn" onClick={() => handleDoiTenTheLoai(c)}>Đổi tên</button>
                      <button
                        type="button" className="admin-view-btn"
                        onClick={() =>
                          chay(
                            () => updateCategory(c.id, { isActive: !c.isActive }),
                            c.isActive ? `Ẩn thể loại "${c.name}"? Mọi truyện thuộc thể loại này cũng sẽ biến mất khỏi cửa hàng.` : null
                          )
                        }
                      >{c.isActive ? "Ẩn" : "Hiện"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {formTruyen !== undefined && (
        <FormTruyen
          truyen={formTruyen}
          theLoai={theLoai}
          onClose={() => setFormTruyen(undefined)}
          onSaved={() => { setThongBao({ loai: "thanh-cong", noiDung: "Đã lưu truyện" }); taiTruyen(); taiTheLoai(); }}
        />
      )}
      {xemTap && (
        <QuanLyTap truyen={xemTap} onClose={() => setXemTap(null)} onChanged={taiTruyen} />
      )}
    </div>
  );
}

export default QuanTriSanPham;