import axios from 'axios';
import { API_URL as GOC } from './cauhinh';
const API_URL = `${GOC}/api/returns`;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export const getEligible = (orderId) => axios.get(`${API_URL}/eligible/${orderId}`, authHeader());
export const createReturn = (data) => axios.post(API_URL, data, authHeader());
export const getMyReturns = () => axios.get(API_URL, authHeader());
export const cancelReturn = (id) => axios.put(`${API_URL}/${id}/cancel`, {}, authHeader());