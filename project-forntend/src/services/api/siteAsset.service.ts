import api from "../http";

export interface SiteAssetParams {
  type?: string;
  active?: number | string;
}

export interface SiteAssetPayload {
  type: "logo" | "certificate" | "hero";
  url: string;
  title?: string;
  alt_text?: string;
  sort_order?: number;
  is_active?: boolean;
}

export default {
  list: (params: SiteAssetParams = {}) => api.get("/api/site-assets", { params }),
  latest: (type: string) => api.get(`/api/site-assets/latest/${type}`),
  create: (payload: SiteAssetPayload) => api.post("/api/site-assets", payload),
  update: (id: number, payload: Partial<SiteAssetPayload>) =>
    api.put(`/api/site-assets/${id}`, payload),
  remove: (id: number) => api.delete(`/api/site-assets/${id}`),
};
