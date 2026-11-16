import mangia from "../assets/images/mangia.jpg";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
function Hero() {
  return (
    <section className="hero">
      <div className="hero-text">
        <h1>Mangia - Cửa hàng Manga</h1>
        <br></br>
        <p>Vũ trụ Manga & Game thu nhỏ ngay trong tầm tay bạn!</p>
        <div className="hero-buttons">
          <Link to="/shop" className="btn-first">Mua ngay</Link>
        </div>
      </div>
      <div className = "hero-image">
        <img src = {mangia} alt = "hero" />
      </div>
    </section>
  );
}
export default Hero;