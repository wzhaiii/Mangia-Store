# Mangia Store

Website bán truyện tranh (manga) trực tuyến, làm cho môn học Thương mại điện tử.

- **Frontend (giao diện):** React + Vite
- **Backend (máy chủ):** Node.js + Express
- **Cơ sở dữ liệu:** SQL Server

## Chức năng chính

**Khách hàng**
- Đăng ký có xác minh email bằng mã OTP, đăng nhập bằng email hoặc Google, quên mật khẩu
- Xem cửa hàng: tìm kiếm, lọc theo thể loại, sắp xếp, phân trang
- Giỏ hàng, thanh toán COD hoặc chuyển khoản (mã QR VietQR), mã giảm giá, miễn phí vận chuyển từ 300.000 VNĐ
- Theo dõi đơn hàng, hủy đơn khi còn chờ xác nhận
- Đánh giá sản phẩm (chỉ khi đã nhận hàng), yêu cầu đổi trả trong 7 ngày
- Chỉnh sửa thông tin tài khoản, đổi mật khẩu

**Quản trị viên**
- Quản lý đơn hàng, sản phẩm, thể loại, kho (có lịch sử nhập xuất), người dùng, đánh giá
- Quản lý mã giảm giá, đổi trả và hoàn tiền
- Báo cáo doanh thu, truyện bán chạy
- Hệ thống tự hủy đơn chuyển khoản quá 24 giờ chưa thanh toán

## Cấu trúc thư mục

```
Backend/    máy chủ (routes, controllers, middleware, utils, config, uploads)
Frontend/   giao diện (src/pages, src/components, src/api, src/context, src/utils)
```

## Yêu cầu cài đặt

- Node.js (khuyên dùng bản LTS)
- SQL Server và SQL Server Management Studio (SSMS)

## Cách chạy

### 1. Tạo cơ sở dữ liệu
1. Mở SSMS, tạo database tên `MangiaStore`.
2. Chạy file SQL trong thư mục `database/` (nếu có) để tạo bảng.
3. Tạo tài khoản đăng nhập SQL Server cho database này.

### 2. Chạy backend
```
cd Backend
npm install
```
Tạo file `.env` từ file mẫu `.env.example` rồi điền giá trị thật. Sau đó:
```
npm run dev
```
Máy chủ chạy tại `http://localhost:5000`.

### 3. Chạy frontend
Mở một cửa sổ terminal mới:
```
cd Frontend
npm install
```
Tạo file `.env` từ file mẫu `.env.example`. Sau đó:
```
npm run dev
```
Mở địa chỉ hiện ra trong terminal (thường là `http://localhost:5173`).

> Mỗi lần sửa file `.env` phải tắt rồi chạy lại lệnh `npm run dev`.

## Biến cấu hình

**Backend/.env**

| Biến | Ý nghĩa |
|---|---|
| DB_USER, DB_PASSWORD | Tài khoản SQL Server |
| DB_SERVER | Dạng `TENMAY\TENINSTANCE` |
| DB_DATABASE | Tên database (`MangiaStore`) |
| JWT_SECRET | Chuỗi bí mật để tạo thẻ đăng nhập |
| PORT | Cổng chạy máy chủ (mặc định 5000) |
| GOOGLE_CLIENT_ID | Mã ứng dụng Google để đăng nhập bằng Google |
| MAIL_USER, MAIL_APP_PASSWORD | Gmail và Mật khẩu ứng dụng (App Password) dùng gửi mã OTP |
| BASE_URL | (Tùy chọn) Địa chỉ backend khi đưa lên mạng, dùng để tạo link ảnh |

**Frontend/.env**

| Biến | Ý nghĩa |
|---|---|
| VITE_API_URL | Địa chỉ backend (mặc định `http://localhost:5000`) |
| VITE_GOOGLE_CLIENT_ID | Mã ứng dụng Google |

## Ghi chú

- Ảnh bìa truyện nằm trong `Backend/uploads/books`. Khi thêm truyện, nhập đường dẫn dạng `/uploads/books/ten-anh.jpg`.
- Muốn có tài khoản quản trị: đăng ký tài khoản thường, rồi vào SQL Server đổi cột `Role` của tài khoản đó thành `admin`.
