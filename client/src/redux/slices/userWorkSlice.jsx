import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  works: [],
  loading: false,
  error: null,
};

const userWorkSlice = createSlice({
  name: "userWorks",
  initialState,
  reducers: {
    fetchWorksStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchWorksSuccess: (state, action) => {
      state.loading = false;
      state.works = action.payload;
    },
    fetchWorksFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    addWork: (state, action) => {
      state.works.unshift(action.payload);
    },
  },
});

export const {
  fetchWorksStart,
  fetchWorksSuccess,
  fetchWorksFailure,
  addWork,
} = userWorkSlice.actions;

export default userWorkSlice.reducer;
