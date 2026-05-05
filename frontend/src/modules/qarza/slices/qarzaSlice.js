import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../lib/api";

const initialState = {
  accounts: [], // all accounts with payments
  payments: {}, // payments keyed by accountId
  currentClickedQarzaAccountData: null,
  currentToUpdateQarzaAccountData: null,
  currentPaymentDataToEdit: null,
  loading: false,
  error: null,
};

// Thunks - accounts
export const fetchQarzaAccounts = createAsyncThunk(
  "qarza/fetchQarzaAccounts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/qarzaRoutes/qarzaAccountGetAll");
      return res.data.data.allAccounts;
    } catch (err) {
      return rejectWithValue(err?.response?.data || err.message);
    }
  }
);

export const createQarzaAccount = createAsyncThunk(
  "qarza/createQarzaAccount",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("/qarzaRoutes/qarzaAccountCreate", payload);
      return res.data.data.allAccounts;
    } catch (err) {
      return rejectWithValue(err?.response?.data || err.message);
    }
  }
);

export const updateQarzaAccount = createAsyncThunk(
  "qarza/updateQarzaAccount",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.put("/qarzaRoutes/qarzaAccountUpdate", payload);
      return res.data.data.allAccounts;
    } catch (err) {
      return rejectWithValue(err?.response?.data || err.message);
    }
  }
);

export const deleteQarzaAccount = createAsyncThunk(
  "qarza/deleteQarzaAccount",
  async (accountId, { rejectWithValue }) => {
    try {
      const res = await api.delete("/qarzaRoutes/qarzaAccountDelete", {
        data: { accountId },
      });
      return res.data.data.allAccounts;
    } catch (err) {
      return rejectWithValue(err?.response?.data || err.message);
    }
  }
);

// Thunks - payments
export const fetchAccountPayments = createAsyncThunk(
  "qarza/fetchAccountPayments",
  async (accountId, { rejectWithValue }) => {
    try {
      const res = await api.post("/qarzaRoutes/getAccountRelatedPayments", {
        accountId,
      });
      return { accountId, payments: res.data.data.allPayments };
    } catch (err) {
      return rejectWithValue(err?.response?.data || err.message);
    }
  }
);

export const createOrUpdatePayment = createAsyncThunk(
  "qarza/createOrUpdatePayment",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post(
        "/qarzaRoutes/qarzaAccountPaymentCreate",
        payload
      );
      // When successful backend returns allPayments for the account
      return {
        accountId: payload.qarzaAccount,
        payments: res.data.data.allPayments,
      };
    } catch (err) {
      return rejectWithValue(err?.response?.data || err.message);
    }
  }
);

export const deletePayment = createAsyncThunk(
  "qarza/deletePayment",
  async (paymentId, { rejectWithValue }) => {
    try {
      const res = await api.delete("/qarzaRoutes/qarzaAccountPaymentDelete", {
        data: { paymentId },
      });

      return {
        paymentId,
        accountId: res.data.data.allPayments.length
          ? res.data.data.allPayments[0].qarzaAccount
          : null,
        payments: res.data.data.allPayments,
      };
    } catch (err) {
      return rejectWithValue(err?.response?.data || err.message);
    }
  }
);

const qarzaSlice = createSlice({
  name: "qarza",
  initialState,
  reducers: {
    setCurrentClickedQarzaAccount(state, action) {
      state.currentClickedQarzaAccountData = action.payload;
    },
    setCurrentToUpdateQarzaAccount(state, action) {
      state.currentToUpdateQarzaAccountData = action.payload;
    },
    setCurrentPaymentDataToEdit(state, action) {
      state.currentPaymentDataToEdit = action.payload;
    },
    clearQarzaState(state) {
      state.currentClickedQarzaAccountData = null;
      state.currentToUpdateQarzaAccountData = null;
      state.currentPaymentDataToEdit = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch accounts
      .addCase(fetchQarzaAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQarzaAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload;
      })
      .addCase(fetchQarzaAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // create account
      .addCase(createQarzaAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQarzaAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload;
      })
      .addCase(createQarzaAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // update account
      .addCase(updateQarzaAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQarzaAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload;
      })
      .addCase(updateQarzaAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // delete account
      .addCase(deleteQarzaAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQarzaAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload;
      })
      .addCase(deleteQarzaAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetch payments
      .addCase(fetchAccountPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccountPayments.fulfilled, (state, action) => {
        state.loading = false;
        const { accountId, payments } = action.payload;
        state.payments[accountId] = payments;
      })
      .addCase(fetchAccountPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // create/update payment
      .addCase(createOrUpdatePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrUpdatePayment.fulfilled, (state, action) => {
        state.loading = false;
        const { accountId, payments } = action.payload;
        state.payments[accountId] = payments;
      })
      .addCase(createOrUpdatePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // delete payment
      .addCase(deletePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePayment.fulfilled, (state, action) => {
        state.loading = false;
        const { accountId, payments, paymentId } = action.payload;

        if (accountId) {
          // normal case: we have the account id
          state.payments[accountId] = payments;
        } else {
          // last-payment-deleted case: find which account had this payment and clear/update it
          let foundAccountId = null;
          for (const [accId, arr] of Object.entries(state.payments)) {
            if (Array.isArray(arr) && arr.some((p) => p._id === paymentId)) {
              foundAccountId = accId;
              break;
            }
          }
          if (foundAccountId) {
            state.payments[foundAccountId] = payments; // will be [] (empty)
          }
        }
      })

      .addCase(deletePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setCurrentClickedQarzaAccount,
  setCurrentToUpdateQarzaAccount,
  setCurrentPaymentDataToEdit,
  clearQarzaState,
} = qarzaSlice.actions;

export default qarzaSlice.reducer;
