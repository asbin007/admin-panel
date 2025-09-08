import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppDispatch } from "./store";
import { API, APIS } from "../globals/http";
import Cookies from "js-cookie";

export interface IUser {
  id: string | null;
  username: string | null;
  email: string | null;
  password: string | null;
  token: string | null;
  role:string|null
}

export enum Status {
  SUCCESS = "success",
  LOADING = "loading",
  ERROR = "error",
}

interface IInitialState {
  user: IUser[];
  status: Status;
}
const initialState: IInitialState = {
  user: [],

  status: Status.LOADING,
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setStatus(state: IInitialState, action: PayloadAction<Status>) {
      state.status = action.payload;
    },
    setUsers(state: IInitialState, action: PayloadAction<IUser[]>) {
      state.user = action.payload;
    },
    deleteUser(state: IInitialState, action: PayloadAction<string>) {
      const index = state.user.findIndex(
        (users) => users.id === action.payload
      );
      if (index !== -1) {
        state.user.splice(index, 1);
      }
    },
    setToken(
      state: IInitialState,
      action: PayloadAction<{ id: string; token: string }>
    ) {
      const user = state.user.find((u) => u.id === action.payload.id);
      if (user) {
        user.token = action.payload.token;
      }
    },
    logout(state: IInitialState) {
     state.user = [];
  state.status = Status.LOADING;
  Cookies.remove("tokenauth");
  // Also clear localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem("tokenauth");
    localStorage.removeItem("userData");
  }
     },
  },
});

export const { setStatus, setUsers, deleteUser, logout, setToken } =
  userSlice.actions;
export default userSlice.reducer;

export function loginUser(data:  { email: string; password: string }) {
  return async function loginUserThunk(dispatch: AppDispatch) {
    try {
      console.log('🔐 Login attempt for:', data.email);
      const response = await API.post("/auth/logins", data);
      console.log('📡 Login response status:', response.status);
      console.log('📡 Login response data:', response.data);
      
      if (response.status === 201) {
        dispatch(setStatus(Status.SUCCESS));
        console.log("✅ Login successful, response data:", response.data);
        const token =
          response.data.token || response.data.session?.access_token;
        const userId = response.data.user?.id ?? 'default';
        const userRole = response.data.user?.role || 'admin';

        if (token && userId) {
          console.log('AuthSlice: Storing token:', token);
          console.log('AuthSlice: User ID:', userId);
          console.log('AuthSlice: User Role:', userRole);
          
          // Check if user is admin
          if (userRole !== 'admin') {
            console.log('❌ Access denied: User is not admin');
            dispatch(setStatus(Status.ERROR));
            throw new Error('Access denied. Admin role required.');
          }
          
          Cookies.set("tokenauth", token, {expires:7});
          // Also store in localStorage for WebSocket compatibility
          if (typeof window !== 'undefined') {
            localStorage.setItem("tokenauth", token);
            console.log('AuthSlice: Token stored in localStorage');
          }
          dispatch(setToken({token,id:userId}));

          // Set user data in Redux store
          const userData = [{
            id: userId,
            username: response.data.user?.username || data.email.split('@')[0],
            email: data.email,
            role: userRole,
            password: null,
            token: token
          }];
          dispatch(setUsers(userData));
          console.log('AuthSlice: User data set:', userData);

          return token
        } else {
          console.log('❌ No token or user ID received');
          dispatch(setStatus(Status.ERROR));
        }
      } else {
        console.log('❌ Login failed, status code:', response.status);
        dispatch(setStatus(Status.ERROR));
      }
    } catch (error: any) {
      console.log('❌ Login error:', error);
      console.log('❌ Error response:', error.response?.data);
      console.log('❌ Error status:', error.response?.status);
      dispatch(setStatus(Status.ERROR));
    }
  };
}

export function fetchUsers() {
  return async function fetchUsersThunk(dispatch: AppDispatch) {
    try {
      const response = await APIS.get("/auth/users");

      if (response.status === 201) {
        dispatch(setStatus(Status.SUCCESS));
        dispatch(setUsers(response.data.data));
      } else {
        dispatch(setStatus(Status.ERROR));
      }
    } catch (error) {
      console.log(error);
      dispatch(setStatus(Status.ERROR));
    }
  };
}

export function deleteUserById(id: string) {
  return async function deleteUserByIdThunk(dispatch: AppDispatch, getState: () => any) {
    try {
      console.log("🗑️ Attempting to delete user with ID:", id);
      console.log("🌐 API Base URL:", "https://nike-backend-1-g9i6.onrender.com/api");
      console.log("🔗 Full delete URL:", `https://nike-backend-1-g9i6.onrender.com/api/auth/users/${id}`);
      
      // Check if user is authenticated
      const token = localStorage.getItem("tokenauth");
      console.log("🔑 Auth token present:", !!token);
      
      // Don't do optimistic update - wait for API response first
      dispatch(setStatus(Status.LOADING));
      
      // Add request timeout and better error handling
      const response = await APIS.delete("/auth/users/" + id, {
        timeout: 10000 // 10 second timeout
        // Headers are already set by APIS interceptor
      });
      
      console.log("✅ Delete response received:", {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });
      
      if (response.status === 200 || response.status === 204) {
        // API success - now remove from UI
        dispatch(deleteUser(id));
        dispatch(setStatus(Status.SUCCESS));
        console.log("✅ User deleted successfully from backend");
        return { success: true, data: response.data };
      } else {
        // If API returns unexpected status
        console.log("❌ Unexpected API response status:", response.status);
        dispatch(setStatus(Status.ERROR));
        throw new Error(response.data?.message || "Failed to delete user");
      }
    } catch (error: any) {
      console.error("❌ Error deleting user:", error);
      
      // Detailed error logging
      const errorDetails = {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          timeout: error.config?.timeout
        }
      };
      
      console.error("🔍 Detailed error information:", errorDetails);
      
      // Log the actual backend response data for debugging
      if (error.response?.data) {
        console.error("📋 Backend error response data:", JSON.stringify(error.response.data, null, 2));
      }
      
      dispatch(setStatus(Status.ERROR));
      
      // Provide specific error messages based on status code
      let errorMessage = "Failed to delete user";
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timeout. The server is taking too long to respond.";
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.response?.status === 500) {
        // Check if it's a foreign key constraint error
        const errorData = error.response?.data;
        if (errorData?.message && errorData.message.includes('foreign key constraint')) {
          errorMessage = "Cannot delete user because they have related data (chats, orders, etc.). Please contact support.";
        } else if (errorData?.message && errorData.message.includes('Internal server error while deleting user')) {
          errorMessage = "Cannot delete user because they have related data. The backend encountered a database constraint error.";
        } else {
          errorMessage = "Server error (500). The backend server encountered an internal error. Please try again later.";
        }
        console.error("🚨 Backend server error - check Render logs");
      } else if (error.response?.status === 404) {
        errorMessage = "User not found. It may have already been deleted.";
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to delete this user.";
      } else if (error.response?.status === 400) {
        // Check for specific backend error messages
        const errorData = error.response?.data;
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        } else if (errorData?.details) {
          errorMessage = errorData.details;
        } else {
          errorMessage = "Cannot delete this user due to existing dependencies or validation errors.";
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      throw new Error(errorMessage);
    }
  };
}
