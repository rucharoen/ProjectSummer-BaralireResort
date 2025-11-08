import { useNavigate } from "react-router-dom";
import CartBody from "../../../components/cart/CartBody";

export default function CartPage() {
  const navigate = useNavigate();
  return <CartBody onClose={() => navigate(-1)} />;
}
