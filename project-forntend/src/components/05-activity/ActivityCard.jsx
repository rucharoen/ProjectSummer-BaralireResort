import { useState } from "react";
import { Modal } from "react-bootstrap";
import "./ActivityCard.css";

const ActivityCard = ({ activity }) => {
  const [showModal, setShowModal] = useState(false);

  const imageUrl = activity?.image_name
    ? `${import.meta.env.VITE_BASE_URL}/uploads/activity/${activity.image_name}`
    : "/fallback-image.jpg";

  const title = activity?.name || "กิจกรรม";
  const description = activity?.description || "รายละเอียดกิจกรรม";

  return (
    <>
      <div className="activity-card-wrapper">
        {/* คลิกเพื่อเปิดโมดัล */}
        <button
          type="button"
          className="activity-card"
          onClick={() => setShowModal(true)}
          aria-label={`ดูรายละเอียดกิจกรรม: ${title}`}
        >
          {/* รูปภาพ */}
          <img
            src={imageUrl}
            alt={title}
            className="activity-image"
            loading="lazy"
            onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
          />

          {/* ✅ overlay ชื่อกิจกรรมเมื่อ hover */}
          <div className="activity-hover-overlay d-flex justify-content-center align-items-center">
            <span className="activity-hover-text">{title}</span>
          </div>
        </button>
      </div>

      {/* Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="lg"
        backdrop="static"
      >
        <Modal.Body className="p-0">
          <div className="position-relative bg-white rounded shadow overflow-hidden">
            <button
              onClick={() => setShowModal(false)}
              className="btn btn-close position-absolute top-0 end-0 m-2 z-3 bg-white rounded-circle p-2"
              aria-label="Close"
              style={{ opacity: 1, boxShadow: "0 0 5px rgba(0,0,0,.3)" }}
            />
            <img
              src={imageUrl}
              alt={title}
              className="w-100 img-fluid"
              style={{ objectFit: "cover", maxHeight: "60vh" }}
            />
            <div className="p-4">
              <h4 className="mb-3 text-center fw-bold" style={{ color: "#333" }}>
                {title}
              </h4>
              <p className="text-center">{description}</p>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ActivityCard;
