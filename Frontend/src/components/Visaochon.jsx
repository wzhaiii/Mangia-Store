import { Truck, ShoppingBag, MessageCircle, RotateCcw } from "lucide-react";
import Demo from "../assets/images/Demo.jpg";
const features = [
    {
        icon: <Truck size = {35} />,
        title: "Giao Hàng Nhanh Chóng Và Miễn Phí",
        desc: 'Vận chuyển hỏa tốc và nhanh gọn đến khách hàng! Mangia cam kết đóng gói chống sốc 3 lớp cho sản phẩm, bảo vệ nguyên vẹn sản phẩm của bạn từ Nhật Bản đến tận tay với chi phí tối ưu nhất.'
    },
    {
        icon: <ShoppingBag size={35} />,
        title: "Mua Sắm Dễ Dàng",
        desc: "Giao diện thông minh, tìm kiếm sản phẩm trong chớp mắt. Hệ thống giỏ hàng của Mangia giúp bạn sở hữu các ấn bản giới hạn dễ dàng chỉ với một cú click chuột.",
    },
    {
        icon: <MessageCircle size={35} />,
        title: "Hỗ Trợ 24/7",
        desc: 'Đội ngũ "phù thủy" hỗ trợ tận tâm, luôn túc trực 24/7 để giải quyết mọi thắc mắc của khách hàng. Chúng tôi không chỉ bán sách, chúng tôi hiểu và trân trọng đam mê của bạn.',
    },
    {
        icon: <RotateCcw size={35} />,
        title: "Đổi Trả Nhanh Chóng",
        desc: "Chính sách đổi trả minh bạch, bảo vệ quyền lợi khách hàng tuyệt đối. Nếu sản phẩm có sai sót hoạc hư hỏng, Mangia sẵn sàng hỗ trợ đổi mới nhanh chóng và miễn phí.",
    },
];

function WhyChooseUs(){
    return (
        <div className = "why-choose" id = "gioi-thieu">
            <div className = "why-choose__content">
                <h2>Vì sao nên chọn Mangia Store?</h2>
                <p className = "why-choose__intro">
                    Khám phá phép màu trong từng trang sách – Trải nghiệm mua sắm tại Mangia trở nên kỳ diệu hơn bao giờ hết!
                </p>
                <div className="why-choose__grid">
                    {features.map((item, index) => (
                        <div className="feature-item" key={index}>
                            <div className="feature-icon">{item.icon}</div>
                            <h3>{item.title}</h3>
                            <p>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className = "why-choose__image">
                <img src = {Demo} alt = "Demo" />
            </div>
        </div>
    );
}
export default WhyChooseUs;