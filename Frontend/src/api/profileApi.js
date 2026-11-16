import axios from 'axios';
import { API_URL as GOC } from './cauhinh';
const API_URL = `${GOC}/api/profile`;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export const getProfile = () => axios.get(API_URL, authHeader());
export const updateProfile = (data) => axios.put(API_URL, data, authHeader());
export const changePassword = (data) => axios.put(`${API_URL}/password`, data, authHeader());