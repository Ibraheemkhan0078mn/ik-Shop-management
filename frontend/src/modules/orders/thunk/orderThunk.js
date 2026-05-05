import { createAsyncThunk } from "@reduxjs/toolkit";
import ordersApi from "./orderApi";

// ✅ Get all orders
export const getOrders = createAsyncThunk(
  "orders/getOrders",
  async (type, { rejectWithValue }) => {
    try {
      const { data } = await ordersApi.fetchOrders(type);
      return data.data?.orders || [];
    } catch (error) {
      console.error("getOrders error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ✅ Add new order (POS checkout)
export const addOrder = createAsyncThunk(
  "orders/addOrder",
  async (body, { rejectWithValue }) => {
    try {
      const { data } = await ordersApi.addOrder(body);
      return data.order || data.data?.order;
    } catch (error) {
      console.error("addOrder error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ✅ Edit order (update payment, etc.)
export const editOrder = createAsyncThunk(
  "orders/editOrder",
  async ({ id, body }, { rejectWithValue }) => {
    try {
      const { data } = await ordersApi.editOrder({ id, body });
      return data.order || data.data?.order;
    } catch (error) {
      console.error("editOrder error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ✅ Delete order
export const deleteOrder = createAsyncThunk(
  "orders/deleteOrder",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await ordersApi.deleteOrder(id);
      return data.id || data.data?.id;
    } catch (error) {
      console.error("deleteOrder error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
