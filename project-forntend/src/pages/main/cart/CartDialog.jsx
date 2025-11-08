import { useEffect } from "react";
import CartBody from "./CartBody";

export default function CartDialog({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="cart-dialog-backdrop" onClick={onClose}>
      <div
        className="cart-dialog"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">รถเข็น</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            ปิด
          </button>
        </div>

        <div className="cart-dialog-body">
          <CartBody onClose={onClose} />
        </div>
      </div>

      {/* สไตล์ในตัวคอมโพเนนท์เพื่อความง่าย */}
      <style>{`
        .cart-dialog-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,.45);
          display: flex; justify-content: center; align-items: center;
          z-index: 1060;
        }
        .cart-dialog {
          width: min(920px, 95vw);
          max-height: 90vh; overflow: auto;
          background: #fff; border-radius: 16px; padding: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,.25);
        }
        .cart-dialog-body { padding-top: 6px; }
        @media (max-width: 576px) {
          .cart-dialog { width: 100%; height: 100%; max-height: 100vh; border-radius: 0; }
        }
      `}</style>
    </div>
  );
}
