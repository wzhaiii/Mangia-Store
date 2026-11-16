import { useEffect, useState, useCallback } from "react";
import QuanTriMenu from "../components/QuanTriMenu";
import PhanTrang from "../components/PhanTrang";
import { useAuth } from "../context/authContext";
import { getAdminUsers, lockUser, changeUserRole } from "../api/adminApi";
import { layLoi } from "../utils/trangthai";
import { useThongBao } from "../context/thongBaoContext";
const LIMIT = 10;

function QuanTriNguoiDung() {
  const { user: toi } = useAuth(); // người đang đăng nhập (để chặn tự khóa mình)
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState(""); // "" = tất cả
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState(null);
  const [thongBao, setThongBao] = useState(null);
  const [dangXuLy, setDangXuLy] = useState(null); // id người đang được xử lý
  const { hoiXacNhan } = useThongBao();

  const tai = useCallback(() => {
    setLoading(true);
    setLoi(null);
    getAdminUsers({ search: search || undefined, role: role || undefined, page, limit: LIMIT })
      .then((res) => {
        setUsers(res.data.data);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.total);
      })
      .catch((err) => setLoi(err.response?.status === 403 ? "Bạn không có quyền quản trị" : layLoi(err)))
      .finally(() => setLoading(false));
  }, [search, role, page]);

  useEffect(() => { tai(); }, [tai]);

  const handleTimKiem = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const chay = async (id, hanhDong, xacNhan) => {
    if (!(await hoiXacNhan(xacNhan))) return;
    setDangXuLy(id);
    setThongBao(null);
    try {
      const res = await hanhDong();
      setThongBao({ loai: "thanh-cong", noiDung: res.data.message });
      await tai();
    } catch (err) {
      setThongBao({ loai: "loi", noiDung: layLoi(err) });
    } finally {
      setDangXuLy(null);
    }
  };

  return (
    <div className="admin-page">
      <h2 className="orders-page__title">Quản trị người dùng</h2>
      <QuanTriMenu />

      <form className="admin-search" onSubmit={handleTimKiem}>
        <input
          type="text" placeholder="Tìm theo họ tên hoặc email..."
          value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="book-buy-btn">Tìm</button>
      </form>

      <div className="category-list">
        {[["", "Tất cả"], ["user", "Khách hàng"], ["admin", "Quản trị viên"]].map(([ma, ten]) => (
          <button
            key={ma} type="button"
            className={`category-item ${role === ma ? "selected" : ""}`}
            onClick={() => { setRole(ma); setPage(1); }}
          >{ten}</button>
        ))}
      </div>

      {thongBao && <p className={`cart-message cart-message--${thongBao.loai}`}>{thongBao.noiDung}</p>}
      {loading && <p>Đang tải...</p>}
      {loi && <p className="cart-message cart-message--loi">{loi}</p>}
      {!loading && !loi && <p className="shop-count">Tìm thấy {total} người dùng</p>}

      {!loading && users.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Mã</th><th>Họ tên</th><th>Email</th><th>Đăng nhập bằng</th><th>Quyền</th><th>Số đơn</th><th>Trạng thái</th><th></th></tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const laToi = toi?.id === u.id;
                const khoa = dangXuLy === u.id;
                return (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td>{u.fullName}{laToi ? " (Bạn)" : ""}</td>
                    <td>{u.email}</td>
                    <td>{u.provider === "google" ? "Google" : "Email"}</td>
                    <td>{u.role === "admin" ? "Quản trị viên" : "Khách hàng"}</td>
                    <td>{u.soDon}</td>
                    <td>
                      <span className={`status-badge ${u.isLocked ? "status-cancelled" : "status-delivered"}`}>
                        {u.isLocked ? "Bị khóa" : "Hoạt động"}
                      </span>
                    </td>
                    <td className="admin-row-actions">
                      <button
                        type="button" className="admin-view-btn" disabled={laToi || khoa}
                        onClick={() =>
                          chay(
                            u.id, () => lockUser(u.id, !u.isLocked),
                            u.isLocked ? `Mở khóa tài khoản ${u.email}?` : `Khóa tài khoản ${u.email}? Người này sẽ không đăng nhập hay đặt hàng được nữa.`
                          )
                        }
                      >{u.isLocked ? "Mở khóa" : "Khóa"}</button>
                      <button
                        type="button" className="admin-view-btn" disabled={laToi || khoa}
                        onClick={() =>
                          chay(
                            u.id, () => changeUserRole(u.id, u.role === "admin" ? "user" : "admin"),
                            u.role === "admin" ? `Gỡ quyền quản trị của ${u.email}?` : `Cấp quyền quản trị cho ${u.email}?`
                          )
                        }
                      >{u.role === "admin" ? "Gỡ quyền admin" : "Cấp quyền admin"}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <PhanTrang page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

export default QuanTriNguoiDung;