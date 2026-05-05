import { createAsyncThunk } from "@reduxjs/toolkit";
import authApi from "./authApi";
import {
  ACCESS_TOKEN,
  getItem,
  removeItem,
  setItem,
} from "../../../utils/localStorage";

export const signupUser = createAsyncThunk(
  "/auth/signup",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await authApi.signup(credentials);

      const { accessToken } = res.data.data || {};
      if (accessToken) {
        setItem(ACCESS_TOKEN, accessToken);
      } else {
        return rejectWithValue("Singup Failed: no access token received");
      }
      const userRes = await authApi.user();
      return userRes?.data?.data?.currentUser;
    } catch (error) {
      console.error("Signup error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  "/auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await authApi.login(credentials);

      const accessKey = res?.data?.data?.accessToken;
      if (accessKey) {
        setItem(ACCESS_TOKEN, accessKey);
      } else {
        return rejectWithValue("Login Failed: no access token received");
      }
      const userRes = await authApi.user();
      const user = userRes?.data?.data?.currentUser;
      return user;
    } catch (error) {
      console.error("getMe error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getUser = createAsyncThunk(
  "/auth/me",
  async (_, { rejectWithValue }) => {
    try {
      const res = await authApi.user();

      return res.data.data.currentUser;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch User");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "/auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const res = await authApi.logout();
      if (!res.status === 200) {
        return rejectWithValue("Logout Failed");
      }
      removeItem(ACCESS_TOKEN);
      window.location.replace("/login");
    } catch (error) {
      return rejectWithValue(error.message || "Something went wrong.");
    }
  }
);
