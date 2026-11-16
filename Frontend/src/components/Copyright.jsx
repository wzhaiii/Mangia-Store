import { FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa";

function Footer() {
    return (
        <footer className="footer" id = "lien-he">
            < div className="footer__all">
                <div className="footer__1">
                    <h3 className = "footer__title">Mangia Store</h3>
                    <p className = "footer__description">Mangia Store là cửa hàng truyện tranh trực tuyến uy tín, cung cấp các sản phẩm chất lượng và dịch vụ tốt nhất cho độc giả.</p>
                    <div className="footer__1-icons">
                        <a href="#" className="footer__icon1"><FaFacebookF /></a>
                        <a href="#" className="footer__icon2"><FaTwitter /></a>
                        <a href="#" className="footer__icon3"><FaInstagram /></a>
                    </div>
                </div>
                <div className="footer__3">
                    <h3 className = "footer__title">Liên Lạc</h3>
                    <div className = "footer__3-links">
                        <p className = "email">Email:support@mangiastore.com</p>
                        <p className = "phone">Điện thoại: +84 123 456 789</p>
                        <p className = "address">Địa chỉ: 123 Đường Truyện, Quận Manga, Thành phố Comic, Việt Nam</p>
                    </div>
                </div>
                <div className="footer__bottom">
                <p>&copy; 2026 Mangia Store. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;