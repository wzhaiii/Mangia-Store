import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useCart } from "../context/cartContext";
import ThanhToanModal from "../components/ThanhToan";
import { MIEN_PHI_TU } from "../utils/trangthai";
function Cart() {
  const { user } = useAuth();
  const { items, totalPrice, totalQuantity, updateItem, removeItem } = useCart();
  const [dangXuLy, setDangXuLy] = useState(null); // volumeId của dòng đang được sửa/xóa
  const [thongBao, setThongBao] = useState(null); // thông báo lỗi
  const [moThanhToan, setMoThanhToan] = useState(false)
  // Chưa đăng nhập thì yêu cầu đăng nhập
  if (!user) {
    return (
      <div className="cart-page">
        <h2 className="cart-page__title">Giỏ hàng</h2>
        <p className="cart-empty">
          Vui lòng <Link to="/login">đăng nhập</Link> để xem giỏ hàng.
        </p>
      </div>
    );
  }

  // Lấy nội dung lỗi từ server để hiển thị
  const layNoiDungLoi = (err) => {
    const status = err.response?.status;
    if (status === 401 || status === 403) {
      return "Phiên đăng nhập đã hết hạn, vui lòng đăng xuất và đăng nhập lại";
    }
    return err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại";
  };

  // Tăng hoặc giảm số lượng của một dòng
  const handleDoiSoLuong = async (item, soLuongMoi) => {
    if (soLuongMoi < 1 || soLuongMoi > item.stock) return;
    setDangXuLy(item.volumeId);
    setThongBao(null);
    try {
      await updateItem(item.volumeId, soLuongMoi);
    } catch (err) {
      setThongBao(layNoiDungLoi(err));
    } finally {
      setDangXuLy(null);
    }
  };

  // Xóa một dòng khỏi giỏ
  const handleXoa = async (item) => {
    setDangXuLy(item.volumeId);
    setThongBao(null);
    try {
      await removeItem(item.volumeId);
    } catch (err) {
      setThongBao(layNoiDungLoi(err));
    } finally {
      setDangXuLy(null);
    }
  };

  // Giỏ rỗng
  if (items.length === 0) {
    return (
      <div className="cart-page">
        <h2 className="cart-page__title">Giỏ hàng</h2>
        <p className="cart-empty">
          Giỏ hàng của bạn đang trống. <Link to="/shop">Đến cửa hàng để chọn truyện</Link>
        </p>
      </div>
    );
  }
  const coLoiTonKho = items.some((i) => i.quantity > i.stock);
  const conThieu = Math.max(MIEN_PHI_TU - totalPrice, 0);        // còn thiếu bao nhiêu tiền
  const phanTram = Math.min((totalPrice / MIEN_PHI_TU) * 100, 100); // thanh đầy bao nhiêu %
  return (
    <div className="cart-page">
      <h2 className="cart-page__title">Giỏ hàng ({totalQuantity} quyển)</h2>
      {thongBao && <p className="cart-message cart-message--loi">{thongBao}</p>}
      <div className={`freeship ${conThieu === 0 ? "freeship--du" : ""}`}>
        <p className="freeship__text">
          {conThieu === 0 ? ("🎉 Đơn hàng của bạn được miễn phí vận chuyển!") : (
            <>Mua thêm <strong>{conThieu.toLocaleString("vi-VN")} VNĐ</strong> để được miễn phí vận chuyển</>
       )}
        </p>
        <div className="freeship__bar">
          <div className="freeship__fill" style={{ width: `${phanTram}%` }} />
        </div>
      </div>
      <div className="cart-list">
        {items.map((item) => {
          const dongNay = dangXuLy === item.volumeId; // dòng này đang xử lý thì khóa nút
          return (
            <div className="cart-item" key={item.volumeId}>
              <Link to={`/books/${item.bookId}`}>
                <img className="cart-item__image" src={item.image} alt={item.title} />
              </Link>
              <div className="cart-item__info">
                <Link to={`/books/${item.bookId}`} className="cart-item__title">
                  {item.title}
                </Link>
                <p>Tập {item.volumeNo}</p>
                <p className="cart-item__price">{item.price.toLocaleString("vi-VN")} VNĐ</p>
                {item.quantity > item.stock && (
                  <p className="cart-message cart-message--loi">
                    Hiện chỉ còn {item.stock} quyển, vui lòng giảm số lượng
                  </p>
                )}
              </div>

              <div className="cart-item__qty">
                <button
                  type="button"
                  disabled={dongNay || item.quantity <= 1}
                  onClick={() => handleDoiSoLuong(item, item.quantity - 1)}
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  disabled={dongNay || item.quantity >= item.stock}
                  onClick={() => handleDoiSoLuong(item, item.quantity + 1)}
                >
                  +
                </button>
              </div>

              <div className="cart-item__total">
                {(item.price * item.quantity).toLocaleString("vi-VN")} VNĐ
              </div>

              <button
                type="button"
                className="cart-item__remove"
                disabled={dongNay}
                onClick={() => handleXoa(item)}
              >
                Xóa
              </button>
            </div>
          );
        })}
      </div>

      <div className="cart-summary">
        <p>
          Tổng tiền: <strong>{totalPrice.toLocaleString("vi-VN")} VNĐ</strong>
        </p>
        <button type="button" className="book-buy-btn" disabled ={coLoiTonKho} onClick={() => setMoThanhToan(true)}>
          Đặt hàng
        </button>
      </div>
      {moThanhToan && <ThanhToanModal
          onClose={() => setMoThanhToan(false)}
        />}
    </div>
  );
}

export default Cart;