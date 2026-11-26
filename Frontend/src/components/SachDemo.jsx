import { useEffect, useState } from "react";
import ShopDescription from "./VeMangiaStore";
import BookDetails from "./Thongtinsach";

import { API_URL } from "../api/cauhinh";

const SO_SAN_PHAM = 3; // số bộ truyện mới nhất hiện ở trang chủ

function ShopIntro() {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController(); // dùng để hủy yêu cầu nếu rời trang giữa chừng
    fetch(`${API_URL}/api/books?limit=${SO_SAN_PHAM}&sort=newest`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Không tải được dữ liệu");
        return res.json();
      })
      .then((json) => setFeaturedBooks(json.data))
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="shop-intro">
      <div className="shop-intro__covers">
        {loading && <p>Đang tải...</p>}
        {error && <p>Lỗi: {error}</p>}
        {!loading && !error &&
          featuredBooks.map((sach) => (
            <BookDetails key={sach.id} sach={sach} />
          ))}
      </div>
      <ShopDescription />
    </div>
  );
}

export default ShopIntro;