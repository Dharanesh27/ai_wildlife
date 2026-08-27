import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: "Administrator" | "Wildlife Researcher" | "Conservation Officer" | "Forest Department Officer";
  is_active: boolean;
  created_at: string;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
}

const getInitialState = (): AuthState => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      try {
        return {
          token,
          user: JSON.parse(userStr),
          isAuthenticated: true,
        };
      } catch {
        // Clear corrupt storage
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }
  return {
    token: null,
    user: null,
    isAuthenticated: false,
  };
};

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialState(),
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ token: string; user: UserProfile }>
    ) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      }
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
