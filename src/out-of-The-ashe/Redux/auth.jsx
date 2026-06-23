import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const API_URL = import.meta.env.VITE_DEFAULT_BACKEND;

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticate: false,
  isloading: false,
  error: null,
  requiresTwoFactor: false,
  pendingUserId: null,
  jobTitle: null,
  department: null,
  twoFactorEnabled: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getStoredToken = () => localStorage.getItem("accessToken");
const getStoredRefresh = () => localStorage.getItem("refreshToken");

// ─── Thunks ───────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 * Success → { success, data: { requiresTwoFactor, accessToken, refreshToken, user } }
 * 2FA     → { success, data: { requiresTwoFactor: true, userId } }
 */
export const LoginUser = createAsyncThunk(
  "auth/login",
  async (credentials, thunkAPI) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        // Server returned 4xx/5xx — data.message is our error string
        return thunkAPI.rejectWithValue(data.message ?? "Login failed");
      }

      return data; // { success: true, message, data: { requiresTwoFactor, ... } }
    } catch {
      return thunkAPI.rejectWithValue("Network error — please check your connection");
    }
  }
);

/**
 * POST /api/v1/auth/2fa/verify
 * Body: { userId, token }
 * Success → { success, data: { accessToken, refreshToken, user } }
 */
export const Verify2FA = createAsyncThunk(
  "auth/verify2fa",
  async (payload, thunkAPI) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/2fa/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) return thunkAPI.rejectWithValue(data.message ?? "Invalid OTP code");
      return data;
    } catch {
      return thunkAPI.rejectWithValue("Network error");
    }
  }
);

/**
 * POST /api/v1/auth/refresh
 * Body: { refreshToken }
 * Success → { success, data: { accessToken } }
 */
export const RefreshToken = createAsyncThunk(
  "auth/refresh",
  async (_, thunkAPI) => {
    const refreshToken = getStoredRefresh();
    if (!refreshToken) return thunkAPI.rejectWithValue("No refresh token");

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();
      if (!response.ok) return thunkAPI.rejectWithValue(data.message ?? "Session expired");
      return data;
    } catch {
      return thunkAPI.rejectWithValue("Network error");
    }
  }
);

/**
 * GET /api/v1/auth/me
 * Header: Authorization: Bearer <token>
 * Success → { success, data: { id, firstName, lastName, email, role, jobTitle, ... } }
 */
export const FetchMe = createAsyncThunk(
  "auth/me",
  async (_, thunkAPI) => {
    const token = getStoredToken();
    if (!token) return thunkAPI.rejectWithValue("Not authenticated");

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) return thunkAPI.rejectWithValue(data.message ?? "Failed to fetch profile");
      return data;
    } catch {
      return thunkAPI.rejectWithValue("Network error");
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticate = false;
      state.error = null;
      state.requiresTwoFactor = false;
      state.pendingUserId = null;
      state.jobTitle = null;
      state.department = null;
      state.twoFactorEnabled = false;
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
    clearError: (state) => {
      state.error = null;
    },
    // Hydrate from localStorage on app boot
    hydrateFromStorage: (state) => {
      const token = getStoredToken();
      const refresh = getStoredRefresh();
      if (token) {
        state.token = token;
        state.refreshToken = refresh;
      }
    },
  },

  extraReducers: (builder) => {
    // ── Login ────────────────────────────────────────────────────────────────
    builder
      .addCase(LoginUser.pending, (state) => {
        state.isloading = true;
        state.error = null;
        state.requiresTwoFactor = false;
      })
      .addCase(LoginUser.fulfilled, (state, action) => {
        state.isloading = false;
        state.error = null;

        const payload = action.payload.data;

        if (payload.requiresTwoFactor) {
          state.requiresTwoFactor = true;
          state.pendingUserId = payload.userId;
          return;
        }

        state.token = payload.accessToken;
        state.refreshToken = payload.refreshToken;
        state.user = payload.user;
        state.isAuthenticate = true;

        localStorage.setItem("accessToken", payload.accessToken);
        localStorage.setItem("refreshToken", payload.refreshToken);
      })
      .addCase(LoginUser.rejected, (state, action) => {
        state.isloading = false;
        state.error = action.payload;
        state.isAuthenticate = false;
      });

    // ── 2FA Verify ───────────────────────────────────────────────────────────
    builder
      .addCase(Verify2FA.pending, (state) => {
        state.isloading = true;
        state.error = null;
      })
      .addCase(Verify2FA.fulfilled, (state, action) => {
        state.isloading = false;
        state.error = null;

        const payload = action.payload.data;
        state.token = payload.accessToken;
        state.refreshToken = payload.refreshToken;
        state.user = payload.user;
        state.isAuthenticate = true;
        state.requiresTwoFactor = false;
        state.pendingUserId = null;

        localStorage.setItem("accessToken", payload.accessToken);
        localStorage.setItem("refreshToken", payload.refreshToken);
      })
      .addCase(Verify2FA.rejected, (state, action) => {
        state.isloading = false;
        state.error = action.payload;
      });

    // ── Token Refresh ────────────────────────────────────────────────────────
    builder
      .addCase(RefreshToken.fulfilled, (state, action) => {
        const { accessToken } = action.payload.data;
        state.token = accessToken;
        localStorage.setItem("accessToken", accessToken);
      })
      .addCase(RefreshToken.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticate = false;
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      });

    // ── Fetch Me ─────────────────────────────────────────────────────────────
    builder
      .addCase(FetchMe.fulfilled, (state, action) => {
        const u = action.payload.data;
        state.user = {
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          role: u.role,
        };
        state.jobTitle = u.jobTitle ?? null;
        state.department = u.department ?? null;
        state.twoFactorEnabled = u.twoFactorEnabled ?? false;
        state.isAuthenticate = true;
        state.token = getStoredToken();
      })
      .addCase(FetchMe.rejected, (state) => {
        state.isAuthenticate = false;
        state.token = null;
        localStorage.removeItem("accessToken");
      });
  },
});

export const { logout, clearError, hydrateFromStorage } = authSlice.actions;
export default authSlice.reducer;