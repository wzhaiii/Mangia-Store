import { createContext, useContext, useState } from 'react';
const AuthContext = createContext(null);
function daHetHan(token) {
  try {
    // Đoạn giữa của mã (payload) chứa thông tin, giải mã ra để đọc được
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; 
  }
}
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      if (savedUser && savedToken && !daHetHan(savedToken)){
        return JSON.parse(savedUser);
      }
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    } catch {
      return null;
    }
  });

  // Gọi khi đăng nhập thành công (cả Gmail lẫn Google)
  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  // Gọi khi bấm Đăng xuất
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('mangia_token'); // dọn key cũ của luồng Google
  };

   const updateUser = (changes) => {
    const moi = { ...user, ...changes };
    setUser(moi);
    localStorage.setItem('user', JSON.stringify(moi));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}