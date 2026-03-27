import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  location: null,

  /* ── Socket / Tracking state ──────────────────────── */
  socketConnected: false,       // is the WS connection live?
  workerTracking: {
    isTracking: false,          // GPS watchPosition active
    speed: 0,                   // km/h
    bearing: 0,                 // degrees (0 = North)
    workerCoords: null,         // { lat, lng }
  },
  liveTracking: {               // (user-side view of worker)
    workerCoords: null,
    distanceKm: null,
    speed: 0,
    bearing: 0,
    hasArrived: false,
  },
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    /* ── Auth ──────────────────────────────────────── */
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setToken: (state, action) => {
      state.token = action.payload;
    },
    setUserLocation: (state, action) => {
      state.location = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.location = null;
      state.socketConnected = false;
      state.workerTracking = initialState.workerTracking;
      state.liveTracking = initialState.liveTracking;
    },

    /* ── Socket ────────────────────────────────────── */
    setSocketConnected: (state, action) => {
      state.socketConnected = action.payload; // boolean
    },

    /* ── Worker GPS tracking ───────────────────────── */
    setWorkerTracking: (state, action) => {
      state.workerTracking = { ...state.workerTracking, ...action.payload };
    },
    appendWorkerPath: (state, action) => {
      const { lat, lng } = action.payload;
      state.workerTracking.workerCoords = { lat, lng };
    },
    clearWorkerTracking: (state) => {
      state.workerTracking = initialState.workerTracking;
    },

    /* ── Live tracking (user-side) ─────────────────── */
    setLiveTracking: (state, action) => {
      state.liveTracking = { ...state.liveTracking, ...action.payload };
    },
    appendLivePath: (state, action) => {
      const { lat, lng } = action.payload;
      state.liveTracking.workerCoords = { lat, lng };
    },
    clearLiveTracking: (state) => {
      state.liveTracking = initialState.liveTracking;
    },
  },
});

export const {
  setUser,
  setToken,
  setUserLocation,
  clearUser,
  setSocketConnected,
  setWorkerTracking,
  appendWorkerPath,
  clearWorkerTracking,
  setLiveTracking,
  appendLivePath,
  clearLiveTracking,
} = userSlice.actions;

export default userSlice.reducer;

