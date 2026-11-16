import { useState } from "react";
import Bopbop from "../assets/images/Bopbop.jpg";
import Ho from "../assets/images/Ho.jpg";
import Meme from "../assets/images/Meme.jpg";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    id: 1,
    quote:
      "Web chạy cực mượt, mình săn bản Limited của Jujutsu Kaisen chỉ mất vài giây. Đóng gói sản phẩm cẩn thận, có trách nhiệm với khách hàng!",
    name: "Phồ Thanh Đụng",
    role: "Collector Manga chuyên nghiệp",
    avatar: Bopbop,
  },
  {
    id: 2,
    quote:
      "Giao diện dễ dùng, tìm truyện theo tác giả nhanh hơn hẳn mấy trang khác mình từng mua.",
    name: "Minh Thư",
    role: "Độc giả trung thành",
    avatar: Ho,
  },
  {
    id: 3,
    quote:
      "Đặt sáng, chiều đã nhận được hàng. Sách đóng gói kỹ, không móp góc.",
    name: "Quốc Bảo",
    role: "Khách hàng thân thiết",
    avatar: Meme,
  },
];

function Testimonials (){
  const [current, setCurrent] = useState(0);
  const handlePrev = () => {
    setCurrent((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };
  const handleNext = () => {
    setCurrent((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };
  const active = testimonials[current];
   return (
    <div className="testimonials" id = "danh-gia">
      <h2 className="testimonials__title">Độc giả nói gì về Mangia Store?</h2>
      <p className="testimonials__quote">"{active.quote}"</p>
      <div className="testimonials__carousel">
        <button className="testimonials__arrow" onClick={handlePrev}>
          <ChevronLeft size={20} />
        </button>
        <div className="testimonials__profile">
          <img src={active.avatar} alt={active.name} className="testimonials__avatar"/>
          <p className="testimonials__name">{active.name}</p>
          <p className="testimonials__role">{active.role}</p>
        </div>
        <button className="testimonials__arrow" onClick={handleNext}>
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="testimonials__dots">
        {testimonials.map((t, index) => (
          <span key={t.id} className={`testimonials__dot ${ index === current ? "testimonials__dot--active" : "" }`}
            onClick={() => setCurrent(index)}
          />
        ))}
      </div>
    </div>
  );
}

export default Testimonials;
