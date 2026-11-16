import axios from 'axios';
import { API_URL as GOC } from './cauhinh';
const API_URL = `${GOC}/api/orders`;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});
export const createOrder = (data) => axios.post(API_URL, data, authHeader());
export const getShippingOptions = (subtotal) =>
  axios.get(`${API_URL}/shipping-options`, { ...authHeader(), params: { subtotal } });
export const getMyOrders = () => axios.get(API_URL, authHeader());
export const getOrderDetail = (id) => axios.get(`${API_URL}/${id}`, authHeader());
export const cancelOrder = (id) => axios.put(`${API_URL}/${id}/cancel`, {}, authHeader());