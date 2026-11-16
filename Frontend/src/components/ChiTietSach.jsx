import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useCart } from "../context/cartContext";
import { NGUONG_SAP_HET } from "../utils/trangthai";
import DanhGia from "./DanhGia";
import { API_URL } from "../api/cauhinh";

function ChiTietSach() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const handleQuayLai = () => {
     // location.key là "default" khi trang này là trang đầu tiên khách mở (không có trang trước trong web mình)
    if (location.key !== "default") navigate(-1); // quay về trang trước trong lịch sử duyệt web
    else navigate("/shop");                        // mở thẳng từ đường link thì về Cửa hàng
   };
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [sach, setSach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null); // VolumeId đang chọn
  const [soLuong, setSoLuong] = useState(1);
  const [dangThem, setDangThem] = useState(false);
  const [thongBao, setThongBao] = useState(null);
  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelectedId(null);
    setSoLuong(1);
    setThongBao(null);
    fetch(`${API_URL}/api/books/${id}`)
      .then((res) => {
        if (res.status === 404) throw new Error("Không tìm thấy sản phẩm");
        if (!res.ok) throw new Error("Không tải được dữ liệu");
        return res.json();
      })
      .then(setSach)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p>{error}</p>;
  const tapDangChon = sach.volumes.find((v) => v.id === selectedId);
  const anhHienThi = tapDangChon?.image || sach.image;
  const handleSoLuongChange = (e) => {
    const value = Number(e.target.value) || 1;
    setSoLuong(Math.min(Math.max(value, 1), tapDangChon.stock));
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setDangThem(true);
    setThongBao(null);
    try {
      await addToCart(tapDangChon.id, soLuong);
      setThongBao({
        loai: "thanh-cong",
        noiDung: `Đã thêm Tập ${tapDangChon.volumeNo} × ${soLuong} vào giỏ hàng`,
      });
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

  return (
    <div className="book-detail">
        <button type="button" className="back-link" onClick={handleQuayLai}>← Quay lại</button>
      <div className="book-detail__main">
        <div className="book-detail__image">
          <img src={anhHienThi} alt={sach.title} />
        </div>
        <div className="book-detail__info">
          <h1 className="book-title">{sach.title}</h1>
          <div className="book-info">
            <p>Tác giả: {sach.author}</p>
            <p>Thể loại: {sach.category}</p>
          </div>
          <p className="book-price">
            Giá: {sach.price.toLocaleString("vi-VN")} VNĐ / tập
          </p>
          <h3>Chọn tập</h3>
          <div className="volume-list">
            {sach.volumes.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`volume-item ${v.id === selectedId ? "selected" : ""}`}
                disabled={v.stock === 0}
                onClick={() => { setSelectedId(v.id); setSoLuong(1); setThongBao(null); }}
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
              <button
                className="book-buy-btn"
                type="button"
                onClick={handleAddToCart}
                disabled={dangThem}
              >
                {dangThem ? "Đang thêm..." : "Thêm vào giỏ"}
              </button>
              {thongBao && (
                <p className={`cart-message cart-message--${thongBao.loai}`}>
                  {thongBao.noiDung}
                </p>
              )}
            </div>
          ) : (
             <p>{sach.volumes.every((v) => v.stock === 0) ? "Bộ truyện này tạm thời hết hàng." : "Vui lòng chọn một tập để mua."}
            </p>
)}

          <div className="book-detail__descrip">
            <h3>Giới thiệu</h3>
            <p>{sach.descrip}</p>
            <DanhGia key={sach.id} bookId={sach.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
export default ChiTietSach;