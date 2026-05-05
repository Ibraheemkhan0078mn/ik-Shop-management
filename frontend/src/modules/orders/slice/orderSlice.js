import { createSlice } from "@reduxjs/toolkit";
import { addOrder, deleteOrder, editOrder, getOrders } from "./orderThunk";

const initialState = {
  list: [],
  error: null,
  loading: false,
};

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(getOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(getOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(addOrder.fulfilled, (state, action) => {
        state.list.unshift(action.payload); // Add latest order at top
      })

      .addCase(editOrder.fulfilled, (state, action) => {
        const index = state.list.findIndex((o) => o._id === action.payload._id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })

      .addCase(deleteOrder.fulfilled, (state, action) => {
        const index = state.list.findIndex((o) => o._id === action.payload);
        if (index !== -1) {
          state.list.splice(index, 1);
        }
      });
  },
});

export default ordersSlice.reducer;
