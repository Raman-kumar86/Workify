import { createSlice } from "@reduxjs/toolkit";

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    stats: null,
    categories: [],
    feePercent: null,
  },
  reducers: {
    setAdminStats: (state, action) => {
      state.stats = action.payload;
    },
    setAdminCategories: (state, action) => {
      state.categories = action.payload;
    },
    addAdminCategory: (state, action) => {
      state.categories.push(action.payload);
    },
    updateAdminCategory: (state, action) => {
      const idx = state.categories.findIndex((c) => c._id === action.payload._id);
      if (idx !== -1) state.categories[idx] = action.payload;
    },
    removeAdminCategory: (state, action) => {
      state.categories = state.categories.filter((c) => c._id !== action.payload);
    },
    setAdminFee: (state, action) => {
      state.feePercent = action.payload;
    },
  },
});

export const {
  setAdminStats,
  setAdminCategories,
  addAdminCategory,
  updateAdminCategory,
  removeAdminCategory,
  setAdminFee,
} = adminSlice.actions;

export default adminSlice.reducer;
