// Dãy nút phân trang dùng chung: Trước | 1 2 3 ... | Sau
function PhanTrang({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)}>Trước</button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button key={p} type="button" className={p === page ? "selected" : ""} onClick={() => onChange(p)}>
          {p}
        </button>
      ))}
      <button type="button" disabled={page === totalPages} onClick={() => onChange(page + 1)}>Sau</button>
    </div>
  );
}

export default PhanTrang;