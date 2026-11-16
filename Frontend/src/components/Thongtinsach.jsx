import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import ChonTap from "./ChonTap";
function BookDetails({ sach }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [moHopThoai, setMoHopThoai] = useState(false); // hộp thoại chọn tập đang mở hay đóng
  const het = sach.totalStock === 0;
  const handleAddToCart = (e) => {
    e.preventDefault();   // chặn Link điều hướng khi bấm nút này
    e.stopPropagation();
    if (het) return;
    // Chưa đăng nhập thì chuyển sang trang đăng nhập
    if (!user) {
      navigate("/login");
      return;
    }
    setMoHopThoai(true);
  };

  return (
    <Link to={`/books/${sach.id}`} className={`book-details ${het ? "book-details--het" : ""}`}>
      <div className = "book-image-wrap">
        <img className="book-image" src={sach.image} alt={sach.title} />
        {het && <span className="book-badge">Hết hàng</span>}
      </div>
      <h3 className="book-title" title={sach.title}>{sach.title}</h3>
      <div className="book-info">
        <p title={sach.author}>Tác giả: {sach.author}</p>
        <p title={sach.category}>Thể loại: {sach.category}</p>
      </div>
      <p className="book-price">Giá: {sach.price.toLocaleString("vi-VN")} VNĐ</p>
      <button className={`book-buy-btn ${het ? "book-buy-btn--het" : ""}`} onClick={handleAddToCart} aria-disabled = {het}>
         {het ? "Hết hàng" : "Thêm vào giỏ"}
      </button>
      {moHopThoai && (
        <ChonTap
          bookId={sach.id}
          title={sach.title}
          onClose={() => setMoHopThoai(false)}
        />
      )}
    </Link>
  );
}

export default BookDetails;