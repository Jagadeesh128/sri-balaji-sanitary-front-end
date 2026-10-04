import axios from "axios";

// Backend base URL - change here if backend runs elsewhere
const BASE_URL = "http://localhost:8080";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------- Inventory (Stock Management) ----------
export const getInventory = () => api.get("/inventory");
export const getInventoryById = (id) => api.get(`/inventory/${id}`);
export const addInventory = (data) => api.post("/inventory", data);
export const updateInventory = (id, data) => api.put(`/inventory/${id}`, data);
export const deleteInventory = (id) => api.delete(`/inventory/${id}`);
export const searchInventory = (query) => api.get(`/inventory/search?query=${encodeURIComponent(query)}`);

// ---------- Discounts (Categories) ----------
export const getCategories = () => api.get("/discounts");
export const getCategoryByBrand = (brand) => api.get(`/discounts/${brand}`);
export const saveCategory = (data) => api.post("/discounts", data);
export const deleteCategory = (brand) => api.delete(`/discounts/${brand}`);

export const getDiscountByBrand = (brand) => api.get(`/discounts/${brand}`);
export const saveQuotation = (data) => api.post("/quotations", data);
export default api;
