import { useEffect, useState } from "react";
import BookDetails from "../components/Thongtinsach";
import { API_URL } from "../api/cauhinh";
const LIMIT = 12;
function Shop() {
  const [books, setBooks] = useState([]);           // danh sách truyện đang hiển thị
  const [categories, setCategories] = useState([]); // danh sách thể loại
  const [searchInput, setSearchInput] = useState(""); // chữ đang gõ trong ô tìm kiếm
  const [search, setSearch] = useState("");           // từ khóa thật sự dùng để tìm
  const [categoryId, setCategoryId] = useState(null); // thể loại đang chọn (null = tất cả)
  const [sort, setSort] = useState("newest"); // cách sắp xếp đang chọn
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // (1) Lấy danh sách thể loại: chỉ chạy 1 lần khi trang vừa hiện ra
  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // (2) Trì hoãn tìm kiếm: đợi người dùng ngừng gõ 0,4 giây mới cập nhật từ khóa
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1); // tìm mới thì quay về trang 1
    }, 400);
    return () => clearTimeout(timer); // gõ tiếp thì hủy bộ đếm cũ
  }, [searchInput]);

  // (3) Lấy danh sách truyện: chạy lại mỗi khi trang, từ khóa hoặc thể loại thay đổi
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    // Trước: const params = new URLSearchParams({ page, limit: LIMIT });
    const params = new URLSearchParams({ page, limit: LIMIT, sort });
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);

    fetch(`${API_URL}/api/books?${params}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Không tải được dữ liệu");
        return res.json();
      })
      .then((json) => {
        setBooks(json.data);
        setTotalPages(json.totalPages);
        setTotal(json.total);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort(); // hủy yêu cầu cũ nếu có yêu cầu mới
  }, [page, search, categoryId, sort]);

  const handleChonTheLoai = (id) => {
    setCategoryId(id);
    setPage(1);
  };
  const handleDoiSapXep = (e) => {
  setSort(e.target.value);
  setPage(1); // đổi cách sắp xếp thì quay về trang 1
};

  const handleDoiTrang = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div className="shop-page">
      <h2 className="shop-page__title">Cửa hàng</h2>
      {/* Ô tìm kiếm */}
      <input
        type="text"
        className="shop-search"
        placeholder="Tìm truyện theo tên..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />
      {/* Các nút lọc thể loại */}
      <div className="category-list">
        <button
          type="button"
          className={`category-item ${categoryId === null ? "selected" : ""}`}
          onClick={() => handleChonTheLoai(null)}
        >
          Tất cả
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`category-item ${categoryId === c.id ? "selected" : ""}`}
            onClick={() => handleChonTheLoai(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="shop-toolbar">
      {!loading && !error ? (
        <p className="shop-count">Tìm thấy {total} sản phẩm</p>
      ) : (
        <span /> /* giữ chỗ để ô chọn luôn nằm bên phải */
  )}
      <label className="shop-sort">Sắp xếp:{" "}
      <select className="admin-select" value={sort} onChange={handleDoiSapXep}>
        <option value="newest">Mới nhất</option>
        <option value="price_asc">Giá: thấp đến cao</option>
        <option value="price_desc">Giá: cao đến thấp</option>
        <option value="title">Tên: A đến Z</option>
      </select>
  </label>
</div>
      {loading && <p>Đang tải...</p>}
      {error && <p>Lỗi: {error}</p>}
      {!loading && !error && books.length === 0 && <p>Không có sản phẩm phù hợp.</p>}
      {/* Lưới sản phẩm: dùng lại component BookDetails như trang chủ */}
      {!loading && !error && (
        <div className="book-grid">
          {books.map((sach) => (
            <BookDetails key={sach.id} sach={sach} />
          ))}
        </div>
      )}
      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="pagination">
          <button type="button" disabled={page === 1} onClick={() => handleDoiTrang(page - 1)}>
            Trước
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              className={p === page ? "selected" : ""}
              onClick={() => handleDoiTrang(p)}
            >
              {p}
            </button>
          ))}
          <button type="button" disabled={page === totalPages} onClick={() => handleDoiTrang(page + 1)}>
            Sau
          </button>
        </div>
      )}
    </div>
  );
}

export default Shop;