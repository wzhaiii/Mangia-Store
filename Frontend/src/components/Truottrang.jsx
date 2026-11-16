import { useEffect } from "react";
import { useLocation } from "react-router-dom";
function ScrollToHash() {
  const { pathname, hash, key } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const timer = setTimeout(() => {
      document
        .getElementById(hash.slice(1)) // "#gioi-thieu" → bỏ dấu # → "gioi-thieu"
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(timer); // chuyển trang trước 100ms thì hủy
  }, [pathname, hash, key]);
  return null;
}

export default ScrollToHash;