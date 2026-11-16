import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "../context/cartContext";
import { createOrder, getShippingOptions } from "../api/orderApi";
import { getProfile } from "../api/profileApi";
import { checkVoucher } from "../api/voucherApi";
export const NGAN_HANG = { bankId: "BIDV", soTaiKhoan: "8881037637", tenChuTK: "NGUYEN MAI GIA HAI" };
function ThanhToanModal({ onClose }) {
  const { totalPrice, loadCart } = useCart();
  const [form, setForm] = useState({
    receiverName: "", phone: "", address: "", ward: "", province: "", note: "",
  });
  const [carriers, setCarriers] = useState([]);       // danh sách hãng + phí ship
  const [carrier, setCarrier] = useState("GHN");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState(null);
  const [donHang, setDonHang] = useState(null);       // có giá trị khi đã đặt xong
  const [maGiam, setMaGiam] = useState("");          // chữ khách gõ trong ô mã
  const [voucher, setVoucher] = useState(null);      // { code, discount } khi mã đã được chấp nhận
  const [loiMa, setLoiMa] = useState(null);
  const [dangKiemMa, setDangKiemMa] = useState(false);
  // Ghi nhớ "đã đặt xong" mà không làm giao diện vẽ lại
  const daDatRef = useRef(false);
  // Hàm trả về trong useEffect sẽ chạy khi hộp thoại bị gỡ khỏi màn hình (lúc đóng).
  // Chỉ lúc đó mới tải lại giỏ hàng, nếu tải ngay khi đặt xong thì giỏ rỗng sẽ
  // làm trang Giỏ hàng đổi giao diện và hộp thoại biến mất trước khi khách kịp xem mã QR.
  useEffect(() => {
    return () => {
      if (daDatRef.current) loadCart();
    };
  }, []);

  // Lấy phí ship của các hãng từ server
  useEffect(() => {
    getShippingOptions(totalPrice)
      .then((res) => setCarriers(res.data))
      .catch(() => setCarriers([]));
  }, [totalPrice]);
  const phiShip = carriers.find((c) => c.carrier === carrier)?.fee ?? 0;
  const giamGia = voucher?.discount ?? 0;
  const tongCong = totalPrice - giamGia + phiShip;

  const handleApDungMa = async () => {
    setLoiMa(null);
    if (!maGiam.trim()) return;
    setDangKiemMa(true);
    try {
      const res = await checkVoucher(maGiam, totalPrice);
      setVoucher(res.data);
    } catch (err) {
      setVoucher(null);
      setLoiMa(err.response?.data?.message || "Không kiểm tra được mã, vui lòng thử lại");
    } finally {
      setDangKiemMa(false);
    }
  };
  const handleBoMa = () => {
    setVoucher(null);
    setMaGiam("");
    setLoiMa(null);
  };
  const handleDoi = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleDatHang = async () => {
    setLoi(null);
    if (!form.receiverName.trim() || !form.phone.trim() || !form.address.trim() || !form.province.trim()) {
      setLoi("Vui lòng nhập đầy đủ các mục có dấu *");
      return;
    }
    if (!/^0\d{9}$/.test(form.phone.trim())) {
      setLoi("Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0");
      return;
    }
    setDangGui(true);
    try {
      const res = await createOrder({ ...form, paymentMethod, shippingCarrier: carrier, voucherCode: voucher?.code });
      daDatRef.current = true;
      setDonHang(res.data);
    } catch (err) {
      const status = err.response?.status;
      setLoi(
        status === 401 || status === 403
          ? "Phiên đăng nhập đã hết hạn, vui lòng đăng xuất và đăng nhập lại"
          : err.response?.data?.message || "Không đặt được hàng, vui lòng thử lại"
      );
    } finally {
      setDangGui(false);
    }
  };
    // Điền sẵn thông tin giao hàng từ hồ sơ khách (chỉ điền vào ô còn trống)
  useEffect(() => {
    getProfile()
      .then((res) => {
        const p = res.data;
        setForm((f) => ({
          ...f,
          receiverName: f.receiverName || p.fullName || "",
          phone: f.phone || p.phone || "",
          address: f.address || p.address || "",
          ward: f.ward || p.ward || "",
          province: f.province || p.province || "",
        }));
      })
      .catch(() => {}); // lỗi thì thôi, khách tự nhập như cũ
  }, []);
  // Địa chỉ ảnh mã QR (VietQR tự điền sẵn số tiền và nội dung chuyển khoản)
  const qrUrl = donHang
    ? `https://img.vietqr.io/image/${NGAN_HANG.bankId}-${NGAN_HANG.soTaiKhoan}-compact2.png` +
      `?amount=${donHang.total}` +
      `&addInfo=${encodeURIComponent("MANGIA " + donHang.orderId)}` +
      `&accountName=${encodeURIComponent(NGAN_HANG.tenChuTK)}`
    : null;
  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !dangGui) onClose(); // bấm ra vùng tối thì đóng
      }}
    >
      <div className="modal-box">
        <div className="modal-header">
          <h3>{donHang ? "Đặt hàng thành công" : "Thanh toán"}</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        {/* ===== Màn hình sau khi đặt xong ===== */}
        {donHang ? (
          <div>
            <p>Mã đơn hàng của bạn: <strong>#{donHang.orderId}</strong></p>
            {donHang.paymentMethod === "COD" ? (
              <p>
                Bạn sẽ thanh toán <strong>{donHang.total.toLocaleString("vi-VN")} VNĐ</strong> cho
                nhân viên giao hàng khi nhận hàng.
              </p>
            ) : (
              <div className="checkout-qr">
                <p>
                  Vui lòng quét mã để chuyển <strong>{donHang.total.toLocaleString("vi-VN")} VNĐ</strong>.
                  Giữ nguyên nội dung chuyển khoản <strong>MANGIA {donHang.orderId}</strong> để
                  cửa hàng đối chiếu.
                </p>
                <img src={qrUrl} alt="Mã QR chuyển khoản" />
                <p>Đơn sẽ được xử lý sau khi cửa hàng xác nhận đã nhận tiền.</p>
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="book-buy-btn" onClick={onClose}>Đóng</button>
            </div>
          </div>
        ) : (
          /* ===== Màn hình nhập thông tin ===== */
          <div>
            <div className="checkout-field">
              <label>Họ tên người nhận *</label>
              <input name="receiverName" value={form.receiverName} onChange={handleDoi} />
            </div>
            <div className="checkout-field">
              <label>Số điện thoại *</label>
              <input name="phone" value={form.phone} onChange={handleDoi} inputMode="numeric" />
            </div>
            <div className="checkout-field">
              <label>Địa chỉ (số nhà, tên đường) *</label>
              <input name="address" value={form.address} onChange={handleDoi} />
            </div>
            <div className="checkout-row">
              <div className="checkout-field">
                <label>Phường/Xã</label>
                <input name="ward" value={form.ward} onChange={handleDoi} />
              </div>
              <div className="checkout-field">
                <label>Tỉnh/Thành phố *</label>
                <input name="province" value={form.province} onChange={handleDoi} />
              </div>
            </div>
            <div className="checkout-field">
              <label>Ghi chú</label>
              <textarea name="note" rows="2" value={form.note} onChange={handleDoi} />
            </div>
            <p><strong>Đơn vị vận chuyển</strong></p>
            {carriers.map((c) => (
              <label key={c.carrier} className={`checkout-option ${carrier === c.carrier ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="carrier"
                  checked={carrier === c.carrier}
                  onChange={() => setCarrier(c.carrier)}
                />
                <span>{c.name}</span>
                <span>{c.fee === 0 ? "Miễn phí" : c.fee.toLocaleString("vi-VN") + " VNĐ"}</span>
              </label>
            ))}
            <p><strong>Phương thức thanh toán</strong></p>
            <label className={`checkout-option ${paymentMethod === "COD" ? "selected" : ""}`}>
              <input type="radio" name="pay" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} />
              <span>Thanh toán khi nhận hàng (COD)</span>
            </label>
            <label className={`checkout-option ${paymentMethod === "BANK" ? "selected" : ""}`}>
              <input type="radio" name="pay" checked={paymentMethod === "BANK"} onChange={() => setPaymentMethod("BANK")} />
              <span>Chuyển khoản ngân hàng (quét mã QR)</span>
            </label>
                        <p><strong>Mã giảm giá</strong></p>
            <div className="voucher-box">
              <input
                value={maGiam}
                onChange={(e) => setMaGiam(e.target.value.toUpperCase())}
                placeholder="Nhập mã giảm giá"
                maxLength={30}
                disabled={!!voucher}
              />
              {voucher ? (
                <button type="button" className="admin-view-btn" onClick={handleBoMa}>Bỏ mã</button>
              ) : (
                <button type="button" className="admin-view-btn" onClick={handleApDungMa}
                  disabled={dangKiemMa || !maGiam.trim()}>
                  {dangKiemMa ? "Đang kiểm tra..." : "Áp dụng"}
                </button>
              )}
            </div>
            {voucher && (
              <p className="cart-message cart-message--thanh-cong">
                Đã áp dụng mã {voucher.code}: giảm {voucher.discount.toLocaleString("vi-VN")} VNĐ
              </p>
            )}
            {loiMa && <p className="cart-message cart-message--loi">{loiMa}</p>}

            <div className="checkout-total">
              <p><span>Tiền hàng</span><span>{totalPrice.toLocaleString("vi-VN")} VNĐ</span></p>
              {giamGia > 0 && (
                <p><span>Giảm giá</span><span>−{giamGia.toLocaleString("vi-VN")} VNĐ</span></p>
              )}
              <p><span>Phí vận chuyển</span><span>{phiShip.toLocaleString("vi-VN")} VNĐ</span></p>
              <p><span>Tổng cộng</span><strong>{tongCong.toLocaleString("vi-VN")} VNĐ</strong></p>
            </div>
            {loi && <p className="cart-message cart-message--loi">{loi}</p>}
            <div className="modal-actions">
              <button type="button" className="book-buy-btn" onClick={handleDatHang} disabled={dangGui}>
                {dangGui ? "Đang đặt hàng..." : "Xác nhận đặt hàng"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default ThanhToanModal;