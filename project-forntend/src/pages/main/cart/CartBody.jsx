import { useNavigate } from "react-router-dom";
import AuthService from "../../../services/auth/auth.service";
import LoginPage from "../../../pages/main/login/LoginPage";
import { useCart } from "./CartContext";

export default function CartBody({ onClose }) {
  const user = AuthService.getCurrentUser();
 const { items, updateQty, remove: removeItem } = useCart();
  const navigate = useNavigate();

  // ถ้ายังไม่ล็อกอิน: แสดงล็อกอิน (ปิดแล้วค่อยกลับ)
  if (!user) return <LoginPage closeLogin={onClose ?? (() => navigate(-1))} />;

  const total = items.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);

  return (
    <div className="container py-4">
      <h4 className="mb-3">รถเข็น</h4>

      {items.length === 0 ? (
        <div className="alert alert-light">ยังไม่มีรายการในรถเข็น</div>
      ) : (
        items.map((i) => (
          <div key={i.id} className="card mb-3">
            <div className="card-body d-flex gap-3 align-items-start">
              {i.cover && (
                <img
                  src={i.cover}
                  alt=""
                  width={160}
                  height={110}
                  style={{ objectFit: "cover" }}
                />
              )}
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between">
                  <h6 className="mb-1">{i.name}</h6>
                  <div className="text-success fw-bold">
                    ฿ {Number(i.price).toLocaleString()}
                  </div>
                </div>

                {Array.isArray(i.perks) && i.perks.length > 0 && (
                  <ul className="small text-muted mb-2">
                    {i.perks.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                )}

                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => updateQty(i.id, Math.max(1, Number(i.qty) - 1))}
                  >
                    -
                  </button>

                  <input
                    className="form-control form-control-sm"
                    style={{ width: 60 }}
                    value={i.qty}
                    onChange={(e) => {
                      const n = Math.max(1, Number(e.target.value || 1));
                      updateQty(i.id, n);
                    }}
                  />

                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => updateQty(i.id, Number(i.qty) + 1)}
                  >
                    +
                  </button>

                  <button
                    className="btn btn-link text-danger ms-3"
                    onClick={() => removeItem(i.id)}
                  >
                    ลบรายการ
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      {items.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="fs-5">
            รวม <span className="text-success">฿ {total.toLocaleString()}</span>
          </div>
          <button className="btn btn-success">
            ชำระเงิน ({items.reduce((s, i) => s + Number(i.qty), 0)})
          </button>
        </div>
      )}
    </div>
  );
}
