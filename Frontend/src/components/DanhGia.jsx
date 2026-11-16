import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authContext";
import PhanTrang from "./PhanTrang";
import {
  getBookReviews, getMyReview, createReview, updateReview, deleteReview,
} from "../api/reviewApi";
import { dinhDangNgay, layLoi } from "../utils/trangthai";
import { useThongBao } from "../context/thongBaoContext";
const LIMIT = 5;

// Hiển thị sao (chỉ để xem, không bấm được). diem có thể là số lẻ như 4.3 → làm tròn thành 4 sao sáng
function HienSao({ diem }) {
  const sao = Math.round(diem);
  return (
    <span className="stars" aria-label={`${diem} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= sao ? "star star--on" : "star"}>★</span>
      ))}
    </span>
  );
}

// 5 ngôi sao bấm được để khách chọn điểm
function ChonSao({ value, onChange }) {
  return (
    <div className="stars stars--pick">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          className={i <= value ? "star star--on" : "star"}
          onClick={() => onChange(i)}
          aria-label={`${i} sao`}
        >★</button>
      ))}
    </div>
  );
}

function DanhGia({ bookId }) {
  const { user } = useAuth();
  const { hoiXacNhan } = useThongBao();
  // ----- Danh sách đánh giá của mọi người -----
  const [tongKet, setTongKet] = useState({ total: 0, average: 0, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [ds, setDs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState(null);

  // ----- Đánh giá của chính khách đang đăng nhập -----
  const [cuaToi, setCuaToi] = useState({ daMua: false, review: null });
  const [dangSua, setDangSua] = useState(false);          // đang mở form sửa
  const [form, setForm] = useState({ rating: 0, comment: "" });
  const [dangGui, setDangGui] = useState(false);
  const [thongBao, setThongBao] = useState(null);

  // Mỗi lần gửi/sửa/xóa xong ta tăng số này lên 1 → các useEffect bên dưới thấy số đổi nên tự tải lại dữ liệu
  const [lanTai, setLanTai] = useState(0);

  // Tải danh sách + thống kê: chạy lại khi đổi trang hoặc khi lanTai tăng
  useEffect(() => {
    setLoading(true);
    setLoi(null);
    getBookReviews(bookId, { page, limit: LIMIT })
      .then((res) => {
        setTongKet(res.data.summary);
        setDs(res.data.data);
        setTotalPages(res.data.totalPages);
      })
      .catch((err) => setLoi(layLoi(err)))
      .finally(() => setLoading(false));
  }, [bookId, page, lanTai]);

  // Tải "đánh giá của tôi": chạy lại khi đăng nhập/đăng xuất hoặc lanTai tăng
  useEffect(() => {
    if (!user) {
      setCuaToi({ daMua: false, review: null });
      return;
    }
    getMyReview(bookId)
      .then((res) => setCuaToi(res.data))
      .catch(() => setCuaToi({ daMua: false, review: null }));
  }, [bookId, user, lanTai]);

  const lamMoi = () => {
    setPage(1);                  // đánh giá mới nằm ở trang 1
    setLanTai((n) => n + 1);
  };

  const moFormSua = () => {
    setForm({ rating: cuaToi.review.rating, comment: cuaToi.review.comment || "" });
    setThongBao(null);
    setDangSua(true);
  };

  const handleGui = async () => {
    setThongBao(null);
    if (form.rating < 1) {
      setThongBao({ loai: "loi", noiDung: "Vui lòng chọn số sao" });
      return;
    }
    setDangGui(true);
    try {
      const data = { rating: form.rating, comment: form.comment };
      const res = cuaToi.review
        ? await updateReview(cuaToi.review.id, data)
        : await createReview(bookId, data);
      setThongBao({ loai: "thanh-cong", noiDung: res.data.message });
      setDangSua(false);
      setForm({ rating: 0, comment: "" });
      lamMoi();
    } catch (err) {
      setThongBao({ loai: "loi", noiDung: layLoi(err) });
    } finally {
      setDangGui(false);
    }
  };

  const handleXoa = async () => {
    if (!(await hoiXacNhan("Bạn chắc chắn muốn xóa đánh giá này?"))) return;
    setThongBao(null);
    try {
      const res = await deleteReview(cuaToi.review.id);
      setThongBao({ loai: "thanh-cong", noiDung: res.data.message });
      setForm({ rating: 0, comment: "" });
      lamMoi();
    } catch (err) {
      setThongBao({ loai: "loi", noiDung: layLoi(err) });
    }
  };

  // ===== Phần form / thông báo tùy tình trạng khách =====
  let khuVucCuaToi;
  if (!user) {
    khuVucCuaToi = (
      <p className="review-note">
        Vui lòng <Link to="/login">đăng nhập</Link> để đánh giá sản phẩm.
      </p>
    );
  } else if (!cuaToi.daMua) {
    khuVucCuaToi = (
      <p className="review-note">
        Chỉ khách đã mua và nhận hàng (đơn ở trạng thái "Đã giao") mới đánh giá được bộ truyện này.
      </p>
    );
  } else if (cuaToi.review && !dangSua) {
    khuVucCuaToi = (
      <div className="review-mine">
        <p><strong>Đánh giá của bạn</strong></p>
        <HienSao diem={cuaToi.review.rating} />
        {cuaToi.review.comment && <p className="review-comment">{cuaToi.review.comment}</p>}
        {!cuaToi.review.isVisible && (
          <p className="cart-message cart-message--loi">
            Đánh giá này đang bị cửa hàng ẩn nên người khác không nhìn thấy.
          </p>
        )}
        <div className="review-actions">
          <button type="button" className="admin-view-btn" onClick={moFormSua}>Sửa</button>
          <button type="button" className="admin-view-btn" onClick={handleXoa}>Xóa</button>
        </div>
      </div>
    );
  } else {
    khuVucCuaToi = (
      <div className="review-form">
        <p><strong>{cuaToi.review ? "Sửa đánh giá của bạn" : "Viết đánh giá của bạn"}</strong></p>
        <ChonSao value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
        <textarea
          rows="4"
          maxLength={1000}
          placeholder="Chia sẻ cảm nhận của bạn về bộ truyện này (không bắt buộc)"
          value={form.comment}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
        />
        <small className="admin-hint">{form.comment.length}/1000 ký tự</small>
        <div className="review-actions">
          <button type="button" className="book-buy-btn" onClick={handleGui} disabled={dangGui}>
            {dangGui ? "Đang gửi..." : cuaToi.review ? "Lưu thay đổi" : "Gửi đánh giá"}
          </button>
          {dangSua && (
            <button type="button" className="admin-view-btn" onClick={() => setDangSua(false)}>Hủy</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="reviews">
      <h3>Đánh giá của khách hàng</h3>

      {/* ----- Thống kê ----- */}
      <div className="review-summary">
        <div className="review-summary__score">
          <strong>{tongKet.total ? tongKet.average.toFixed(1) : "—"}</strong>
          <HienSao diem={tongKet.average} />
          <span>{tongKet.total} đánh giá</span>
        </div>
        <div className="review-summary__bars">
          {[5, 4, 3, 2, 1].map((s) => (
            <div className="review-bar-row" key={s}>
              <span>{s} ★</span>
              <div className="review-bar">
                <div
                  className="review-bar__fill"
                  style={{ width: `${tongKet.total ? (tongKet.counts[s] / tongKet.total) * 100 : 0}%` }}
                />
              </div>
              <span>{tongKet.counts[s]}</span>
            </div>
          ))}
        </div>
      </div>

      {khuVucCuaToi}
      {thongBao && <p className={`cart-message cart-message--${thongBao.loai}`}>{thongBao.noiDung}</p>}

      {/* ----- Danh sách ----- */}
      {loading && <p>Đang tải đánh giá...</p>}
      {loi && <p className="cart-message cart-message--loi">{loi}</p>}
      {!loading && !loi && ds.length === 0 && (
        <p className="review-note">Chưa có đánh giá nào cho bộ truyện này.</p>
      )}
      <div className="review-list">
        {ds.map((r) => (
          <div className="review-item" key={r.id}>
            <div className="review-item__top">
              <strong>{r.userName}</strong>
              <HienSao diem={r.rating} />
            </div>
            <span className="history-time">
              {dinhDangNgay(r.createdAt)}{r.updatedAt ? " (đã chỉnh sửa)" : ""}
            </span>
            {r.comment && <p className="review-comment">{r.comment}</p>}
          </div>
        ))}
      </div>
      <PhanTrang page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

export default DanhGia;