// Địa chỉ máy chủ backend. Đọc từ biến VITE_API_URL, không có thì dùng localhost (khi chạy trên máy bạn)
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';