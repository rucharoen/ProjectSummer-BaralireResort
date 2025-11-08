import HeroImage from "../../../components/01-heroimage/HeroImage";
import SearchBox from "../../../components/02-search/SearchBox";
import Promotion from "../../../components/03-promotion/Promotion";
import RoomType from "../../../components/04-roomtype/RoomType";
import Activity from "../../../components/05-activity/Activity";
import Certificate from "../../../components/06-certificate/Certificate";
import "./HomeSearch.css";

export default function HomePage() {
  return (
    <main id="home" className="home">
      {/* Hero */}
      <HeroImage />

      {/* Search (ลอยทับขอบล่างของ hero; สไตล์คุมที่ HomeSearch.css) */}
      <section id="search" className="search-box-wrapper">
        <SearchBox />
      </section>

      {/* Promotion */}
      <section
        id="PromotionSection"
        className="section-pad"
        aria-labelledby="promotion-title"
      >
        <div className="container">
          <h3 id="promotion-title" className="fw-bold text-center">
            <span className="promo-underline">โปรโมชัน</span>
          </h3>

          <Promotion />
          <hr className="section-divider" />
        </div>
      </section>

      {/* Room Types */}
      <section
        id="PopularSection"
        className="section-pad"
        aria-labelledby="roomtype-title"
      >
        <div className="container">
          <h3 id="roomtype-title" className="fw-bold text-center mb-4">
            <span className="promo-underline">
              ประเภทห้องพัก
            </span>
          </h3>

          <RoomType />
          <hr className="section-divider" />
        </div>
      </section>

      {/* Activities */}
      <section
        id="ActivitySection"
        className="section-pad text-center"
        aria-labelledby="activity-title"
      >
        <div className="container">
          <h3 id="activity-title" className="fw-bold">
            <span>สนุกกับกิจกรรมชายหาดของเรา</span>
          </h3>
          <p className="mx-auto section-lead">
            แขกจะรู้สึกเหมือนอยู่บ้านเมื่อได้ใช้สิ่งอำนวยความสะดวกและกิจกรรมต่างๆ
            ของรีสอร์ท
          </p>

          <Activity />
        </div>
      </section>

      {/* Certificates */}
      <section
        id="CertificateSection"
        className="section-pad"
        aria-labelledby="certificate-title"
      >
        <div className="container">
          <h3 id="certificate-title" className="fw-bold text-center">
            <span className="promo-underline">
              รางวัลและการรับรองคุณภาพ
            </span>
          </h3>

          <Certificate />
        </div>
      </section>
    </main>
  );
}
