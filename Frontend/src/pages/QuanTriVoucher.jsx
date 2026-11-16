import { useEffect, useState, useCallback } from "react";
import QuanTriMenu from "../components/QuanTriMenu";
import { getAdminVouchers, createVoucher, updateVoucher, setVoucherActive } from "../api/adminApi";
import { layLoi } from "../utils/trangthai";
import { useThongBao } from "../context/thongBaoContext";

// Đổi ngày từ server sang chuỗi mà ô <input type="datetime-local"> hiểu (theo GIỜ MÁY)
const sangInputNgay = (s) => {
  if (!s) return "";
  const d = new Date(s);
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 16);
};
const hienNgay = (s) => (s ? new Date(s).toLocaleString("vi-VN") : "Không giới hạn");
const tien = (n) => Number(n).toLocaleString("vi-VN") + " VNĐ";

// ===== Hộp thoại thêm / sửa 1 mã =====
function FormVoucher({ voucher, onClose, onSaved }) {
  const [form, setForm] = useState({
    code: voucher?.code || "",
    discountType: voucher?.discountType || "percent",
    discountValue: voucher?.discountValue ?? "",
    maxDiscount: voucher?.maxDiscount ?? "",
    minOrder: voucher?.minOrder ?? 0,
    usageLimit: voucher?.usageLimit ?? "",
    perUserLimit: voucher?.perUserLimit ?? 1,
    startsAt: sangInputNgay(voucher?.startsAt),
    expiresAt: sangInputNgay(voucher?.expiresAt),
  });
  const [loi, setLoi] = useState(null);
  const [dangLuu, setDangLuu] = useState(false);

  const handleDoi = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLuu = async () => {
    setLoi(null);
    if (!voucher && !form.code.trim()) {
      setLoi("Vui lòng nhập mã");
      return;
    }
    if (!form.discountValue) {
      setLoi("Vui lòng nhập mức giảm");
      return;
    }
    setDangLuu(true);
    try {
      if (voucher) await updateVoucher(voucher.id, form);
      else await createVoucher(form);
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
          <h3>{voucher ? `Sửa mã ${voucher.code}` : "Thêm mã giảm giá"}</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="checkout-field">
          <label>Mã *</label>
          <input name="code" value={form.code} disabled={!!voucher} maxLength={30}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
        </div>
        <div className="checkout-row">
          <div className="checkout-field">
            <label>Loại giảm *</label>
            <select name="discountType" className="admin-select" value={form.discountType} onChange={handleDoi}>
              <option value="percent">Giảm theo %</option>
              <option value="fixed">Giảm số tiền cố định</option>
            </select>
          </div>
          <div className="checkout-field">
            <label>{form.discountType === "percent" ? "Phần trăm giảm *" : "Số tiền giảm (VNĐ) *"}</label>
            <input name="discountValue" type="number" min="1" value={form.discountValue} onChange={handleDoi} />
          </div>
        </div>
        {form.discountType === "percent" && (
          <div className="checkout-field">
            <label>Giảm tối đa (VNĐ, để trống nếu không giới hạn)</label>
            <input name="maxDiscount" type="number" min="1" value={form.maxDiscount} onChange={handleDoi} />
          </div>
        )}
        <div className="checkout-row">
          <div className="checkout-field">
            <label>Đơn tối thiểu (VNĐ)</label>
            <input name="minOrder" type="number" min="0" value={form.minOrder} onChange={handleDoi} />
          </div>
          <div className="checkout-field">
            <label>Mỗi khách dùng tối đa (lần)</label>
            <input name="perUserLimit" type="number" min="1" value={form.perUserLimit} onChange={handleDoi} />
          </div>
        </div>
        <div className="checkout-field">
          <label>Tổng số lượt dùng (để trống nếu không giới hạn)</label>
          <input name="usageLimit" type="number" min="1" value={form.usageLimit} onChange={handleDoi} />
        </div>
        <div className="checkout-row">
          <div className="checkout-field">
            <label>Bắt đầu (để trống = ngay lập tức)</label>
            <input name="startsAt" type="datetime-local" value={form.startsAt} onChange={handleDoi} />
          </div>
          <div className="checkout-field">
            <label>Hết hạn (để trống = không hết hạn)</label>
            <input name="expiresAt" type="datetime-local" value={form.expiresAt} onChange={handleDoi} />
          </div>
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

function QuanTriVoucher() {
  const { hoiXacNhan, hienThongBao } = useThongBao();
  const [ds, setDs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState(null);
  const [form, setForm] = useState(undefined); // undefined = đóng, null = thêm mới, object = sửa

  const tai = useCallback(() => {
    setLoading(true);
    setLoi(null);
    getAdminVouchers()
      .then((res) => setDs(res.data))
      .catch((err) => setLoi(err.response?.status === 403 ? "Bạn không có quyền quản trị" : layLoi(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { tai(); }, [tai]);

  const handleBatTat = async (v) => {
    if (v.isActive && !(await hoiXacNhan(`Tắt mã ${v.code}? Khách sẽ không dùng được mã này nữa.`))) return;
    try {
      const res = await setVoucherActive(v.id, !v.isActive);
      hienThongBao(res.data.message);
      tai();
    } catch (err) {
      hienThongBao(layLoi(err), "loi");
    }
  };

  const nhanTrangThai = (v) => {
    if (!v.isActive) return ["status-cancelled", "Đã tắt"];
    if (v.hetHan) return ["status-cancelled", "Hết hạn"];
    if (v.usageLimit !== null && v.usedCount >= v.usageLimit) return ["status-cancelled", "Hết lượt"];
    return ["status-delivered", "Đang chạy"];
  };

  return (
    <div className="admin-page">
      <h2 className="orders-page__title">Quản trị mã giảm giá</h2>
      <QuanTriMenu />
      <div className="admin-toolbar">
        <span className="shop-count">Có {ds.length} mã</span>
        <button type="button" className="book-buy-btn" onClick={() => setForm(null)}>+ Thêm mã</button>
      </div>
      {loading && <p>Đang tải...</p>}
      {loi && <p className="cart-message cart-message--loi">{loi}</p>}
      {!loading && ds.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Mã</th><th>Mức giảm</th><th>Đơn tối thiểu</th><th>Đã dùng</th><th>Mỗi khách</th><th>Hiệu lực</th><th>Trạng thái</th><th></th></tr>
            </thead>
            <tbody>
              {ds.map((v) => {
                const [lop, chu] = nhanTrangThai(v);
                return (
                  <tr key={v.id}>
                    <td><strong>{v.code}</strong></td>
                    <td>
                      {v.discountType === "percent"
                        ? `${v.discountValue}%${v.maxDiscount ? ` (tối đa ${tien(v.maxDiscount)})` : ""}`
                        : tien(v.discountValue)}
                    </td>
                    <td>{tien(v.minOrder)}</td>
                    <td>{v.usedCount}{v.usageLimit !== null ? ` / ${v.usageLimit}` : ""}</td>
                    <td>{v.perUserLimit} lần</td>
                    <td>
                      <span className="admin-hint">Từ: {v.startsAt ? hienNgay(v.startsAt) : "Ngay"}</span>
                      <span className="admin-hint">Đến: {hienNgay(v.expiresAt)}</span>
                    </td>
                    <td><span className={`status-badge ${lop}`}>{chu}</span></td>
                    <td className="admin-row-actions">
                      <button type="button" className="admin-view-btn" onClick={() => setForm(v)}>Sửa</button>
                      <button type="button" className="admin-view-btn" onClick={() => handleBatTat(v)}>
                        {v.isActive ? "Tắt" : "Bật"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {form !== undefined && (
        <FormVoucher
          voucher={form}
          onClose={() => setForm(undefined)}
          onSaved={() => { hienThongBao("Đã lưu mã giảm giá"); tai(); }}
        />
      )}
    </div>
  );
}

export default QuanTriVoucher;