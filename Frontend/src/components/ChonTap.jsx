import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "../context/cartContext";
import { useThongBao } from "../context/thongBaoContext";
import { NGUONG_SAP_HET } from "../utils/trangthai";
import { API_URL } from "../api/cauhinh";
function ChonTapModal({ bookId, title, onClose }) {
  const { addToCart } = useCart();
  const { hienThongBao } = useThongBao();
  const [volumes, setVolumes] = useState([]);        // danh sách các tập
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null); // tập đang chọn
  const [soLuong, setSoLuong] = useState(1);
  const [dangThem, setDangThem] = useState(false);
  const [thongBao, setThongBao] = useState(null);     

  // Lấy danh sách tập của bộ truyện này khi hộp thoại vừa mở
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/api/books/${bookId}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Không tải được danh sách tập");
        return res.json();
      })
      .then((json) => setVolumes(json.volumes))
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [bookId]);
  const tapDangChon = volumes.find((v) => v.id === selectedId);
  const handleChonTap = (id) => {
    setSelectedId(id);
    setSoLuong(1);
    setThongBao(null);
  };

  const handleSoLuongChange = (e) => {
    const value = Number(e.target.value) || 1;
    setSoLuong(Math.min(Math.max(value, 1), tapDangChon.stock));
  };

  const handleThem = async () => {
    setDangThem(true);
    setThongBao(null);
    try {
      await addToCart(tapDangChon.id, soLuong);
      hienThongBao(`Đã thêm Tập ${tapDangChon.volumeNo} × ${soLuong} vào giỏ hàng`);
      onClose();
    } catch (err) {
      const status = err.response?.status;
      const noiDung =
        status === 401 || status === 403
          ? "Phiên đăng nhập đã hết hạn, vui lòng đăng xuất và đăng nhập lại"
          : err.response?.data?.message || "Không thêm được vào giỏ hàng";
      setThongBao({ loai: "loi", noiDung });
    } finally {
      setDangThem(false);
    }
  };
  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => {
        e.stopPropagation(); // chặn click "nổi bọt" lên thẻ truyện (nếu không sẽ bị chuyển trang)
        if (e.target === e.currentTarget) onClose(); // bấm ra vùng tối bên ngoài thì đóng
      }}
    >
      <div className="modal-box">
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        {loading && <p>Đang tải...</p>}
        {error && <p className="cart-message cart-message--loi">{error}</p>}
        {!loading && !error && (
          <>
            <p>Chọn tập:</p>
            <div className="volume-list">
              {volumes.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={`volume-item ${v.id === selectedId ? "selected" : ""}`}
                  disabled={v.stock === 0}
                  onClick={() => handleChonTap(v.id)}
                >
                  <span className="volume-item__so">Tập {v.volumeNo}</span>
                  {v.stock === 0 && <small className="volume-item__het">Hết hàng</small>}
                </button>
              ))}
            </div>
            {tapDangChon ? (
              <div className="purchase-box">
                <p>Tập {tapDangChon.volumeNo}: Còn {tapDangChon.stock} quyển
                  {tapDangChon.stock <= NGUONG_SAP_HET && (
                  <span className="stock-warning"> — Sắp hết hàng!</span>
  )}
                </p>
                <label>
                  Số lượng:{" "}
                  <input
                    type="number"
                    min="1"
                    max={tapDangChon.stock}
                    value={soLuong}
                    onChange={handleSoLuongChange}
                  />
                </label>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="book-buy-btn"
                    onClick={handleThem}
                    disabled={dangThem}
                  >
                    {dangThem ? "Đang thêm..." : "Thêm vào giỏ"}
                  </button>
                </div>
              </div>
            ) : (
              <p>Vui lòng chọn một tập để mua.</p>
            )}
            {thongBao && (
              <p className={`cart-message cart-message--${thongBao.loai}`}>
                {thongBao.noiDung}
              </p>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

export default ChonTapModal;