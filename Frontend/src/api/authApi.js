import axios from 'axios';
import { API_URL as GOC } from './cauhinh';
const API_URL = `${GOC}/api/auth`;
export const registerUser = (data) => axios.post(`${API_URL}/register`, data);
export const verifyOtp = (data) => axios.post(`${API_URL}/verify-otp`, data);
export const resendOtp = (data) => axios.post(`${API_URL}/resend-otp`, data);
export const loginUser = (data) => axios.post(`${API_URL}/login`, data);
export const forgotPassword = (data) => axios.post(`${API_URL}/forgot-password`, data);
export const resetPassword = (data) => axios.post(`${API_URL}/reset-password`, data);