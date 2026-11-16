import axios from 'axios';
import { API_URL as GOC } from './cauhinh';
const API_URL = `${GOC}/api/cart`;
// Mỗi yêu cầu đều phải kèm thẻ đăng nhập (đã lưu ở localStorage khi đăng nhập)
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});
export const getCart = () => axios.get(API_URL, authHeader());
export const addToCart = (volumeId, quantity) =>
  axios.post(API_URL, { volumeId, quantity }, authHeader());
export const updateCartItem = (volumeId, quantity) =>
  axios.put(`${API_URL}/${volumeId}`, { quantity }, authHeader());
export const removeCartItem = (volumeId) =>
  axios.delete(`${API_URL}/${volumeId}`, authHeader());