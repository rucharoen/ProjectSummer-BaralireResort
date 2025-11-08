import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
// import "../../css/Trolley.css";

const Trolley = ({
  showCart,
  setShowCart,
  selectedAccommodation,
  setSelectedAccommodation,
}) => {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState([]);

  const toggleSelect = (index) => {
    setSelectedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleRemoveItem = (indexToRemove) => {
    const updatedAccommodation = selectedAccommodation.filter(
      (_, idx) => idx !== indexToRemove
    );
    setSelectedAccommodation(updatedAccommodation);

    localStorage.setItem(
      "selectedAccommodation",
      JSON.stringify(updatedAccommodation)
    );

    setSelectedItems(
      (prev) =>
        prev
          .filter((idx) => idx !== indexToRemove)
          .map((idx) => (idx > indexToRemove ? idx - 1 : idx)) // อัปเดต index หลังลบ
    );
  };

  const totalSelectedPrice = selectedItems.reduce(
    (sum, idx) =>
      sum + Number(selectedAccommodation[idx]?.discountedPrice || 0),
    0
  );

  useEffect(() => {
    setSelectedItems(selectedAccommodation.map((_, idx) => idx));
  }, [selectedAccommodation]);

  return (
    <Modal
      show={showCart}
      onHide={() => setShowCart(false)}
      centered
      size="xl" // ลองเพิ่ม xl ด้วย
      dialogClassName="custom-modal-width" // คลาสเดิม
    >
      <Modal.Header closeButton>
        <Modal.Title>รถเข็น ({selectedAccommodation.length})</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "700px", overflowY: "auto" }}>
        {selectedAccommodation.map((state, index) => (
          <div key={index} className="card mb-3 p-4 ">
            <div
              className="row g-3 align-items-center"
              style={{ paddingLeft: "1rem" }}
            >
              <input
                type="checkbox"
                className="form-check-input position-absolute"
                style={{
                  top: "50%",
                  left: "10px",
                  transform: "translateY(-50%) scale(1.5)",
                }}
                checked={selectedItems.includes(index)}
                onChange={() => toggleSelect(index)}
              />

              <div className="col-md-4 position-relative ">
                <img
                  src={state.image || "https://picsum.photos/id/57/800/600"}
                  alt="ห้องพัก"
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: "5px",
                    boxShadow: "0 0 20px rgba(0,0,0,0.15)",
                  }}
                />
              </div>
              <div className="col-md-8">
                <div className="d-flex justify-content-between align-items-start flex-column flex-md-row">
                  <div>
                    <h5 className="fw-bold">
                      {state.name || `ห้องพัก ${index + 1}`}
                    </h5>
                    <ul>
                      {(Array.isArray(state.amenities)
                        ? state.amenities
                        : typeof state.amenities === "string"
                        ? state.amenities.split(",").map((item) => item.trim())
                        : []
                      )
                        .slice(0, 5) // จำกัด 5 รายการแรก
                        .map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                    </ul>

                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleRemoveItem(index)}
                    >
                      🗑 ลบ
                    </button>
                  </div>
                  <div className="text-end mt-3 mt-md-0">
                    <div className="text-danger fw-bold mb-1">
                      ประหยัด {state.discountPercentage || 50}%
                    </div>
                    <div className="text-warning mb-1">
                      ⭐⭐⭐⭐⭐ ({state.reviews || 95})
                    </div>
                    <div className="text-decoration-line-through text-muted small">
                      {state.originalPrice?.toLocaleString() || "34,000"} บาท
                    </div>
                    <div className="fs-4 fw-bold text-success">
                      ฿ {state.discountedPrice?.toLocaleString() || "14,280"}
                    </div>
                    <div className="text-muted small">
                      รวมภาษีและค่าธรรมเนียม
                    </div>
                    <div className="d-flex justify-content-end mt-2">
                      <div className="input-group input-group-sm custom-qty-input-group">
                        <button className="btn btn-outline-secondary">-</button>
                        <input
                          type="text"
                          className="form-control text-center"
                          value={state.quantity || 1}
                          readOnly
                        />
                        <button className="btn btn-outline-secondary">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="card p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <div className="fw-bold fs-5">
              ทั้งหมด (เลือก {selectedItems.length} รายการ)
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="fs-5 fw-bold text-success">
                ฿ {totalSelectedPrice.toLocaleString()}
              </div>
              <button
                className="btn btn-success btn-sm"
                disabled={selectedItems.length === 0}
                onClick={() => {
                  setShowCart(false);
                  const selectedRoom = selectedAccommodation[selectedItems[0]];
                  navigate("/booking", {
                    state: {
                      name: selectedRoom.name,
                      image: selectedRoom.image,
                      price: selectedRoom.discountedPrice,
                      checkIn: selectedRoom.checkIn,
                      checkOut: selectedRoom.checkOut,
                      amenities: selectedRoom.amenities,
                    },
                  });
                }}
              >
                ชำระเงิน ({selectedItems.length})
              </button>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default Trolley;
