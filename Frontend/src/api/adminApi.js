import axios from 'axios';
import { API_URL as GOC } from './cauhinh';
const API_URL = `${GOC}/api/admin`;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});
 
// ----- Đơn hàng -----
export const getAdminSummary = () => axios.get(`${API_URL}/summary`, authHeader());
export const getAdminOrders = (params) =>
  axios.get(`${API_URL}/orders`, { ...authHeader(), params });
export const getAdminOrderDetail = (id) => axios.get(`${API_URL}/orders/${id}`, authHeader());
export const changeOrderStatus = (id, status) =>
  axios.put(`${API_URL}/orders/${id}/status`, { status }, authHeader());
export const confirmPayment = (id) =>
  axios.put(`${API_URL}/orders/${id}/payment-paid`, {}, authHeader());
 
// ----- Thể loại -----
export const getAdminCategories = () => axios.get(`${API_URL}/categories`, authHeader());
export const createCategory = (data) => axios.post(`${API_URL}/categories`, data, authHeader());
export const updateCategory = (id, data) => axios.put(`${API_URL}/categories/${id}`, data, authHeader());
 
// ----- Truyện và tập -----
export const getAdminBooks = (params) =>
  axios.get(`${API_URL}/books`, { ...authHeader(), params });
export const getAdminBookDetail = (id) => axios.get(`${API_URL}/books/${id}`, authHeader());
export const createBook = (data) => axios.post(`${API_URL}/books`, data, authHeader());
export const updateBook = (id, data) => axios.put(`${API_URL}/books/${id}`, data, authHeader());
export const createVolume = (bookId, data) =>
  axios.post(`${API_URL}/books/${bookId}/volumes`, data, authHeader());
export const updateVolume = (volumeId, data) =>
  axios.put(`${API_URL}/volumes/${volumeId}`, data, authHeader());
 
// ----- Kho -----
export const getStockVolumes = (params) =>
  axios.get(`${API_URL}/stock/volumes`, { ...authHeader(), params });
export const getStockMovements = (params) =>
  axios.get(`${API_URL}/stock/movements`, { ...authHeader(), params });
export const adjustStock = (data) => axios.post(`${API_URL}/stock/adjust`, data, authHeader());
 
// ----- Người dùng -----
export const getAdminUsers = (params) =>
  axios.get(`${API_URL}/users`, { ...authHeader(), params });
export const lockUser = (id, locked) =>
  axios.put(`${API_URL}/users/${id}/lock`, { locked }, authHeader());
export const changeUserRole = (id, role) =>
  axios.put(`${API_URL}/users/${id}/role`, { role }, authHeader());
 
// ----- Báo cáo -----
export const getAdminReport = (params) =>
  axios.get(`${API_URL}/reports`, { ...authHeader(), params });
// ----- Đánh giá -----
export const getAdminReviews = (params) =>
  axios.get(`${API_URL}/reviews`, { ...authHeader(), params });
export const setReviewVisible = (id, visible) =>
  axios.put(`${API_URL}/reviews/${id}/visibility`, { visible }, authHeader());
// ----- Mã giảm giá -----
export const getAdminVouchers = () => axios.get(`${API_URL}/vouchers`, authHeader());
export const createVoucher = (data) => axios.post(`${API_URL}/vouchers`, data, authHeader());
export const updateVoucher = (id, data) => axios.put(`${API_URL}/vouchers/${id}`, data, authHeader());
export const setVoucherActive = (id, isActive) =>
  axios.put(`${API_URL}/vouchers/${id}/active`, { isActive }, authHeader());
// ----- Đổi trả và hoàn tiền -----
export const getAdminReturns = (params) =>
  axios.get(`${API_URL}/returns`, { ...authHeader(), params });
export const approveReturn = (id, note) =>
  axios.put(`${API_URL}/returns/${id}/approve`, { note }, authHeader());
export const rejectReturn = (id, note) =>
  axios.put(`${API_URL}/returns/${id}/reject`, { note }, authHeader());
export const completeReturn = (id, data) =>
  axios.put(`${API_URL}/returns/${id}/complete`, data, authHeader());
export const getAdminRefunds = (params) =>
  axios.get(`${API_URL}/refunds`, { ...authHeader(), params });
export const completeRefund = (id, note) =>
  axios.put(`${API_URL}/refunds/${id}/complete`, { note }, authHeader());