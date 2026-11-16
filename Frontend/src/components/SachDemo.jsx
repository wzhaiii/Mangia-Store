import { useEffect, useState } from "react";
import ShopDescription from "./VeMangiaStore";
import BookDetails from "./Thongtinsach";

import { API_URL } from "../api/cauhinh";

function ShopIntro() {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const featureIds = [1,2,3];
    Promise.all(
      featureIds.map((id) =>
        fetch(`${API_URL}/api/books/${id}`).then((res) => {
          if (!res.ok) throw new Error("Không tải được dữ liệu");
          return res.json();
        })
    )
    )
      .then((danhSach) => setFeaturedBooks( danhSach.map((b) => ({...b,
      // Cộng tồn kho của các tập (route chi tiết chỉ trả các tập đang bán)
      totalStock: b.volumes.reduce((tong, v) => tong + v.stock, 0),
    }))
  )
)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
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