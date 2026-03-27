import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice.jsx";
import userWorkReducer from "./slices/userWorkSlice.jsx";
import adminReducer from "./slices/adminSlice.jsx";

const store = configureStore({
  reducer: {
    user: userReducer,
    userWorks: userWorkReducer,
    admin: adminReducer,
  },
});

export default store;
