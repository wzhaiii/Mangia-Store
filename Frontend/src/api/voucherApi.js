import axios from 'axios';
import { API_URL as GOC } from './cauhinh';
const API_URL = `${GOC}/api/vouchers`;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export const checkVoucher = (code, subtotal) =>
  axios.post(`${API_URL}/check`, { code, subtotal }, authHeader());