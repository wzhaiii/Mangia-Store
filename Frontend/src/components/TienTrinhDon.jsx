import { Check } from "lucide-react";
import { TRANG_THAI_DON, CAC_BUOC_DON } from "../utils/trangthai";

// Thanh tiến trình: Chờ xác nhận → Đã xác nhận → Đang giao → Đã giao
function TienTrinhDon({ status }) {
  if (status === "cancelled") {
    return <p className="stepper-huy">Đơn hàng đã bị hủy</p>;
  }
  const viTri = CAC_BUOC_DON.indexOf(status); // bước hiện tại là bước thứ mấy (đếm từ 0)
  return (
    <ol className="stepper">
      {CAC_BUOC_DON.map((tt, i) => {
        const xong = i < viTri || status === "delivered"; // bước đã đi qua (đơn đã giao thì cả 4 bước đều xong)
        const loai = xong ? "xong" : i === viTri ? "hien-tai" : "chua";
        return (
          <li key={tt} className={`stepper__buoc stepper__buoc--${loai}`}>
            <span className="stepper__vong">
              {xong ? <Check size={14} strokeWidth={3} /> : i + 1}
            </span>
            <span className="stepper__chu">{TRANG_THAI_DON[tt]}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default TienTrinhDon;