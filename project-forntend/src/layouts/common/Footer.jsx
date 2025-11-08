import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import {
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaTripadvisor,
} from "react-icons/fa";
// import "../../css/Footer.css";

const Footer = () => {
  return (
    <footer
      className="py-4 text-dark"
      style={{ backgroundColor: "rgba(240, 240, 240, 1)" }}
      id="Contact"
    >
      <Container>
        <Row>
          <Col md={3}>
            <h5>เกี่ยวกับรีสอร์ท</h5>
            <ul className="list-unstyled">
              <li>
                <a href="/" className="text-dark text-decoration-none">
                  โปรโมชัน
                </a>
              </li>
              <li>
                <a href="/about" className="text-dark text-decoration-none">
                  เกี่ยวกับเรา
                </a>
              </li>
              <li>
                <a href="/contact" className="text-dark text-decoration-none">
                  กิจกรรม
                </a>
              </li>
              <li>
                <a href="/faq" className="text-dark text-decoration-none">
                  ที่ตั้ง
                </a>
              </li>
            </ul>
          </Col>
          <Col md={3}>
            <h5>ประเภทห้องพัก</h5>
            <ul className="list-unstyled">
              <li>
                <a
                  href="/rooms/deluxe"
                  className="text-dark text-decoration-none"
                >
                  วิลล่าดีลักซ์
                </a>
              </li>
              <li>
                <a
                  href="/rooms/suite"
                  className="text-dark text-decoration-none"
                >
                  วิลล่าพรีเมียร์ดีลักซ์
                </a>
              </li>
              <li>
                <a
                  href="/rooms/family"
                  className="text-dark text-decoration-none"
                >
                  วิลล่าริมชายหาด
                </a>
              </li>
              <li>
                <a
                  href="/rooms/family"
                  className="text-dark text-decoration-none"
                >
                  วิลล่าริมสระน้ำ
                </a>
              </li>
              <li>
                <a
                  href="/rooms/villa"
                  className="text-dark text-decoration-none"
                >
                  วิลล่า จูเนียร์ สวีท
                </a>
              </li>
            </ul>
          </Col>
          <Col md={3}>
            <h5>จุดหมายและกิจกรรม</h5>
            <ul className="list-unstyled">
              <li>
                <a
                  href="/destinations/beach"
                  className="text-dark text-decoration-none"
                >
                  เกี่ยวกับเกาะช้าง
                </a>
              </li>
            </ul>
            <h5>ที่อยู่</h5>
            <ul className="list-unstyled">
              <li>
                <a
                  href="/destinations/beach"
                  className="text-dark text-decoration-none"
                >
                  77 หาดคลองพร้าว เกาะช้าง จ.ตราด 23170
                </a>
              </li>
              <li>
                <a
                  href="/destinations/beach"
                  className="text-dark text-decoration-none"
                >
                  โทร: 039-557-091
                </a>
              </li>
            </ul>
          </Col>
          <Col md={3}>
            <h5>ติดตาม</h5>
            <div className="d-flex align-items-center gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-dark"
              >
                <FaInstagram className="social-icon" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-dark"
              >
                <FaFacebook className="social-icon" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-dark"
              >
                <FaYoutube className="social-icon" />
              </a>
              <a
                href="https://tripadvisor.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-dark"
              >
                <FaTripadvisor className="social-icon" />
              </a>
            </div>
          </Col>
        </Row>
        
      </Container>
    </footer>
  );
};

export default Footer;
