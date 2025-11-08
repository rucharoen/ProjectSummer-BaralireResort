// services/api/promotion.service.js
import http from "./http"; // axios instance

export const PromotionAPI = {
  getBest: () => http.get("/promo/best"),
  getAll:  () => http.get("/promo/prices"),
};
