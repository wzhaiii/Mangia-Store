import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
// Context = "kho chứa" dữ liệu/hàm dùng chung, trang nào cũng lấy ra dùng được
// Tiêu đề tự động theo loại thông báo (nếu nơi gọi không tự đặt tiêu đề)
const TIEU_DE_MAC_DINH = {
  "thanh-cong": "Thành công",
  "loi": "Lỗi",
};
const ThongBaoContext = createContext(null);

export function ThongBaoProvider({ children }) {
  const [toasts, setToasts] = useState([]);       // các thông báo nhỏ đang hiện
  const [hop, setHop] = useState(null);           // hộp xác nhận/nhập chữ đang mở (null = không có)
  const [giaTriNhap, setGiaTriNhap] = useState(""); // chữ khách gõ trong hộp nhập
  const idRef = useRef(0);                        // bộ đếm để mỗi thông báo có mã riêng

  // Xóa 1 thông báo theo mã (dùng cho nút ✕ và cho bộ hẹn giờ tự tắt)
  const xoaToast = useCallback((id) => {
  setToasts((ds) => ds.filter((t) => t.id !== id));
}, []);

// Hiện thông báo ở góc màn hình, tự biến mất sau 3 giây
const hienThongBao = useCallback((noiDung, loai = "thanh-cong", tieuDe) => {
  const id = ++idRef.current;
  setToasts((ds) => [
    ...ds,
    { id, noiDung, loai, tieuDe: tieuDe || TIEU_DE_MAC_DINH[loai] },
  ]);
  setTimeout(() => xoaToast(id), 3000);
}, [xoaToast]);

  // Hỏi xác nhận. Trả về Promise (lời hứa: kết quả sẽ có SAU, khi khách bấm nút).
  // Dùng: if (!(await hoiXacNhan("Bạn chắc chắn?"))) return;
  // "await" nghĩa là "chờ khách bấm xong rồi mới chạy tiếp". Kết quả: true = Đồng ý, false = Hủy
  const hoiXacNhan = useCallback(
    (noiDung) => new Promise((resolve) => setHop({ kieu: "xacnhan", noiDung, resolve })),
    []
  );

  // Hỏi khách nhập 1 đoạn chữ. Kết quả: chữ đã nhập, hoặc null nếu khách bấm Hủy
  const hoiNhap = useCallback(
    (noiDung, macDinh = "") =>
      new Promise((resolve) => {
        setGiaTriNhap(macDinh);
        setHop({ kieu: "nhap", noiDung, resolve });
      }),
    []
  );

  // Đóng hộp và trả kết quả cho nơi đang chờ
  const dongHop = (dongY) => {
    const ketQua = hop.kieu === "nhap" ? (dongY ? giaTriNhap : null) : dongY;
    hop.resolve(ketQua);
    setHop(null);
  };

  // Bấm phím Esc thì coi như Hủy
  useEffect(() => {
    if (!hop) return;
    const onKey = (e) => { if (e.key === "Escape") dongHop(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hop]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ThongBaoContext.Provider value={{ hienThongBao, hoiXacNhan, hoiNhap }}>
      {children}

      {/* Các thông báo nhỏ (vẽ ra ngoài cùng trang bằng createPortal như hộp thoại của bạn) */}
      {createPortal(
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast--${t.loai}`} role="status">
              <span className="toast__icon">
                {t.loai === "thanh-cong" ? <Check size={16} strokeWidth={3} /> : "!"}
              </span>
              <div className="toast__noidung">
                <strong className="toast__tieude">{t.tieuDe}</strong>
                <p className="toast__mota">{t.noiDung}</p>
              </div>
              <button type="button" className="toast__dong" onClick={() => xoaToast(t.id)} aria-label="Đóng thông báo">
                <X size={18} />
              </button>
              </div>
))}
        </div>,
        document.body
      )}

      {/* Hộp xác nhận / nhập chữ */}
      {hop &&
        createPortal(
          <div
            className="modal-overlay modal-overlay--tren"
            onClick={(e) => { if (e.target === e.currentTarget) dongHop(false); }}
          >
            <div className="modal-box">
              <p className="confirm-text">{hop.noiDung}</p>
              {hop.kieu === "nhap" && (
                <input
                  className="confirm-input"
                  autoFocus
                  value={giaTriNhap}
                  onChange={(e) => setGiaTriNhap(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") dongHop(true); }}
                />
              )}
              <div className="confirm-actions">
                <button type="button" className="admin-view-btn" onClick={() => dongHop(false)}>
                  Hủy bỏ
                </button>
                <button type="button" className="book-buy-btn" onClick={() => dongHop(true)}>
                  Đồng ý
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ThongBaoContext.Provider>
  );
}

// Hook (hàm bắt đầu bằng "use", để lấy dữ liệu từ context ra dùng)
export function useThongBao() {
  return useContext(ThongBaoContext);
}