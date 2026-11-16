import Itadori from "../assets/images/Itadori.jpg";
import Naruto from "../assets/images/Naruto.jpg";
import Kira from "../assets/images/Kira.jpg";
function ImageCollapse() {
    return (
        <div className = "image-collage">
            <div className="collage-wrapper">
                <img src = {Itadori} alt = "Manga 1" className = "collage-img Image-main"/>
                <img src = {Naruto} alt = "Manga 2" className = "collage-img Image-top"/>
                <img src = {Kira} alt = "Manga 3" className = "collage-img Image-bottom"/>
            </div>
            <div className = "image-collage__content">
                <div className = "image-collage__intro">
                    <h2>Mangia - Vũ Trụ Anime Ngay Trong Tầm Tay Bạn</h2>
                    <p>Trải nghiệm và khám phá bất tận về thế giới Anime cùng Mangia!</p>
                </div>
                <div className = "image-collage__grid">
                    <div className = "image-collage__grid1">
                        <h3 align = "center">Bộ lọc thông minh</h3>
                        <p>Tìm kiếm sản phẩm bạn muốn theo thể loại, tác giả hoặc nhà xuất bản với kết quả chính xác và nhanh nhất. </p>
                    </div>
                    <div className = "image-collage__grid2">
                        <h3 align = "center">Giao diện thân thiện</h3>
                        <p>Mangia mang đến trải nghiệm mua sắm trực tuyến dễ dàng và thuận tiện, giúp bạn tìm thấy những bộ truyện yêu thích chỉ trong vài cú nhấp chuột.</p>
                    </div>
                    <div className = "image-collage__grid3">
                        <h3 align = "center">Đa dạng sản phẩm</h3>
                        <p>Từ những bộ truyện nổi tiếng đến các ấn bản giới hạn, Mangia cung cấp một loạt các sản phẩm Anime mới và bán chạy nhất để bạn lựa chọn.</p>
                    </div>
                    <div className = "image-collage__grid4">
                        <h3 align = "center">Hỗ trợ khách hàng</h3>
                        <p>Đội ngũ hỗ trợ của Mangia luôn sẵn sàng giúp đỡ bạn, giải đáp mọi thắc mắc và đảm bảo trải nghiệm mua sắm của bạn luôn suôn sẻ.</p>
                    </div>
                </div>
            </div>
        </div>
  );
}

export default ImageCollapse;