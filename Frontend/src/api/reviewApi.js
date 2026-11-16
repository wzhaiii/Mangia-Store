import axios from 'axios';
import { API_URL as GOC } from './cauhinh';
const API_URL = `${GOC}/api/reviews`;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

// Xem đánh giá: không cần đăng nhập nên không gắn thẻ đăng nhập
export const getBookReviews = (bookId, params) =>
  axios.get(`${API_URL}/book/${bookId}`, { params });
export const getMyReview = (bookId) => axios.get(`${API_URL}/book/${bookId}/mine`, authHeader());
export const createReview = (bookId, data) =>
  axios.post(`${API_URL}/book/${bookId}`, data, authHeader());
export const updateReview = (id, data) => axios.put(`${API_URL}/${id}`, data, authHeader());
export const deleteReview = (id) => axios.delete(`${API_URL}/${id}`, authHeader());