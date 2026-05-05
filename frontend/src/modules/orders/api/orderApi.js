import api from "../../lib/api";

const ordersApi = {
  fetchOrders: (type = "other") => api.get(`/orders?orderType=${type}`),
  addOrder: (body) => api.post("/orders", body),
  editOrder: ({ id, body }) => api.put(`/orders/${id}`, body),
  deleteOrder: (id) => api.delete(`/orders/${id}`),
};

export default ordersApi;
