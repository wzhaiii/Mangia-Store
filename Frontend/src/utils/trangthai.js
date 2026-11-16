export const MIEN_PHI_TU = 300000;   // phải khớp MIEN_PHI_TU trong order.js (server)
export const NGUONG_SAP_HET = 5;     // khớp NGUONG_SAP_HET trong adminStock.js
export const CAC_BUOC_DON = ['pending', 'confirmed', 'shipping', 'delivered']; // các bước của thanh tiến trình
export const TRANG_THAI_DON = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};
export const TRANG_THAI_THANH_TOAN = {
  pending: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  cancelled: 'Đã hủy',
};
export const PHUONG_THUC = { COD: 'Thanh toán khi nhận hàng', BANK: 'Chuyển khoản ngân hàng' };
export const HANG_VAN_CHUYEN = { GHN: 'Giao Hàng Nhanh', GHTK: 'Giao Hàng Tiết Kiệm' };
// Giống bảng quy tắc ở server: từ trạng thái này được chuyển sang những trạng thái nào
export const CHUYEN_TIEP = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['delivered'],
  delivered: [],
  cancelled: [],
};
// Chữ trên nút bấm của admin
export const NHAN_NUT = {
  confirmed: 'Xác nhận đơn',
  shipping: 'Bắt đầu giao hàng',
  delivered: 'Đã giao thành công',
  cancelled: 'Hủy đơn',
};
export const dinhDangNgay = (s) => (s ? new Date(s).toLocaleString('vi-VN') : '');
export const layLoi = (err) => {
  const status = err.response?.status;
  if (status === 401) return 'Phiên đăng nhập đã hết hạn, vui lòng đăng xuất và đăng nhập lại';
  return err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại';
};
// Lý do thay đổi tồn kho (khớp cột Reason trong bảng StockMovements)
export const LY_DO_KHO = {
  initial: 'Tồn kho ban đầu',
  import: 'Nhập kho',
  adjust: 'Điều chỉnh kiểm kê',
  damaged: 'Hỏng / mất',
  order: 'Bán (đơn hàng)',
  order_cancel: 'Hoàn kho do hủy đơn',
  return: 'Nhập lại kho do trả hàng',
  exchange: 'Xuất hàng đổi cho khách',
};
export const SO_NGAY_DOI_TRA = 7; // phải khớp SO_NGAY_DOI_TRA trong returnService.js (server)
export const TRANG_THAI_DOI_TRA = {
  requested: 'Chờ duyệt',
  approved: 'Đã duyệt, chờ nhận hàng trả',
  rejected: 'Bị từ chối',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
};
export const LOAI_DOI_TRA = {
  refund: 'Trả hàng và hoàn tiền',
  exchange: 'Đổi sang cuốn mới (cùng tập)',
};
export const TRANG_THAI_HOAN_TIEN = { pending: 'Chờ hoàn tiền', completed: 'Đã hoàn tiền' };
export const LY_DO_HOAN_TIEN = { order_cancel: 'Hủy đơn đã thanh toán', return: 'Trả hàng' };