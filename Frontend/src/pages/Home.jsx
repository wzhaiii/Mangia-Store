import ShopIntro from "../components/SachDemo";
import Hero from "../components/Mangia";
import WhyChooseUs from "../components/Visaochon";
import ImageCollapse from "../components/Vutruanime";
import Review from "../components/Docgianoigi";
import Footer from "../components/Copyright";
function Home(){
    return (
        <div className = "home-page">
            <Hero />
            <ShopIntro />
            <WhyChooseUs />
            <ImageCollapse/>
            <Review/>
            <Footer />
        </div>
    );
}
export default Home;