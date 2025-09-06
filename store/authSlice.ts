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
          const userId=response.data.user?.id ??'default'

        if (token &&userId) {
          console.log('AuthSlice: Storing token:', token);
          console.log('AuthSlice: User ID:', userId);
          Cookies.set("tokenauth", token,{expires:7});
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
            role: response.data.user?.role || 'admin',
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
  return async function deleteUserByIdThunk(dispatch: AppDispatch) {
    try {
      console.log("Deleting user with ID:", id);
      
      // Optimistically update UI first
      dispatch(deleteUser(id));
      dispatch(setStatus(Status.SUCCESS));
      
      const response = await APIS.delete("/auth/users/" + id);
      
      console.log("Delete response:", response.status, response.data);
      
      if (response.status === 200 || response.status === 204) {
        // User already removed from UI, just return success
        return response.data;
      } else {
        // If API fails, we need to revert the optimistic update
        dispatch(setStatus(Status.ERROR));
        throw new Error(response.data?.message || "Failed to delete user");
      }
    } catch (error: any) {
      console.error("Error deleting user:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      dispatch(setStatus(Status.ERROR));
      throw new Error(
        error.response?.data?.message || error.message || "Failed to delete user"
      );
    }
  };
}
