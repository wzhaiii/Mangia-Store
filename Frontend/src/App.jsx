import Home from "./pages/Home";
import Dieuhuongtrang from "./components/Dieuhuongtrang";
import { Routes, Route } from "react-router-dom";
import Register from './pages/Register';
import Login from './pages/Login';
import ChiTietSach from "./components/ChiTietSach";
import Shop from './pages/Shop';
import Cart from "./pages/Cart";
import DonHangCuaToi from "./pages/DonHangCuaToi";
import ChiTietDonHang from "./pages/ChiTietDonHang";
import QuanTriDonHang from "./pages/QuanTriDonHang";
import QuanTriRoute from "./components/QuanTriRoute";
import QuanTriSanPham from "./pages/QuanTriSanPham";
import QuanTriKho from "./pages/QuanTriKho";
import QuanTriNguoiDung from "./pages/QuanTriNguoiDung";
import QuanTriBaoCao from "./pages/QuanTriBaoCao";
import ScrollToHash from "./components/Truottrang";
import QuanTriDanhGia from "./pages/QuanTriDanhGia";
import TaiKhoan from "./pages/TaiKhoan";
import QuenMatKhau from "./pages/QuenMatKhau";
import TraHang from "./pages/TraHang";
import YeuCauDoiTra from "./pages/YeuCauDoiTra";
import QuanTriVoucher from "./pages/QuanTriVoucher";
import QuanTriDoiTra from "./pages/QuanTriDoiTra";
import "./App.css";
function App(){
  return (
    <div className = "App">
      <Dieuhuongtrang />
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path ="/shop" element={<Shop />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/books/:id" element={<ChiTietSach />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/orders" element={<DonHangCuaToi />} />
        <Route path="/orders/:id" element={<ChiTietDonHang />} />
        <Route path="/admin/books" element={<QuanTriRoute><QuanTriSanPham /></QuanTriRoute>} />
        <Route path="/admin/stock" element={<QuanTriRoute><QuanTriKho /></QuanTriRoute>} />
        <Route path="/admin/users" element={<QuanTriRoute><QuanTriNguoiDung /></QuanTriRoute>} />
        <Route path="/admin/reports" element={<QuanTriRoute><QuanTriBaoCao /></QuanTriRoute>} />
        <Route path="/admin/reviews" element={<QuanTriRoute><QuanTriDanhGia /></QuanTriRoute>} />
        <Route path="/profile" element={<TaiKhoan />} />
        <Route path="/forgot-password" element={<QuenMatKhau />} />
        <Route path="/returns" element={<YeuCauDoiTra />} />
        <Route path="/orders/:id/return" element={<TraHang />} />
        <Route path="/admin/vouchers" element={<QuanTriRoute><QuanTriVoucher /></QuanTriRoute>} />
        <Route path="/admin/returns" element={<QuanTriRoute><QuanTriDoiTra /></QuanTriRoute>} />
        <Route path="/admin/orders" element={
          <QuanTriRoute>
            <QuanTriDonHang />
          </QuanTriRoute>
        } />
      </Routes>
    </div>
  );
}
export default App;