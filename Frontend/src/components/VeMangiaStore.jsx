import { ArrowLeft } from 'lucide-react';
function ShopDescription (){
    return (
        <div className = "shop-description">
            <h2>Về Mangia Store</h2>
            <p>Chào mừng bạn đến với Mangia Store, nơi mang đến cho bạn những trải nghiệm 
               tuyệt vời về thế giới Manga và Game. Chúng tôi tự hào là một cửa hàng trực 
               tuyến chuyên cung cấp các sản phẩm chất lượng cao từ các bộ truyện tranh nổi 
               tiếng và các trò chơi hấp dẫn.</p>
            <div className = "shop-description_pointer">
                <ArrowLeft size = {30} color = "#1e3a5f" />
                <span>SẢN PHẨM MỚI NHẤT</span>
            </div>
        </div>
    )
}
export default ShopDescription;