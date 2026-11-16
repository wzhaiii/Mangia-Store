import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './authContext';
import * as cartApi from '../api/cartApi';
const CartContext = createContext(null);
export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]); // các dòng trong giỏ
  // Tải giỏ hàng từ server. Chưa đăng nhập thì giỏ rỗng
  const loadCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    try {
      const res = await cartApi.getCart();
      setItems(res.data);
    } catch {
      setItems([]);
    }
  }, [user]);
  // Tự tải lại giỏ khi đăng nhập hoặc đăng xuất
  useEffect(() => {
    loadCart();
  }, [loadCart]);
  // Thêm/sửa/xóa xong thì tải lại giỏ để mọi nơi cùng cập nhật
  const addToCart = async (volumeId, quantity) => {
    await cartApi.addToCart(volumeId, quantity); // lỗi sẽ được ném ra cho nơi gọi xử lý
    await loadCart();
  };
  const updateItem = async (volumeId, quantity) => {
    await cartApi.updateCartItem(volumeId, quantity);
    await loadCart();
  };
  const removeItem = async (volumeId) => {
    await cartApi.removeCartItem(volumeId);
    await loadCart();
  };
  // Tổng số quyển trong giỏ (dùng cho số hiện trên biểu tượng 🛒)
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  // Tổng tiền (dùng cho trang giỏ hàng ở bước sau)
  const totalPrice = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
  return (
    <CartContext.Provider
      value={{ items, totalQuantity, totalPrice, addToCart, updateItem, removeItem, loadCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}