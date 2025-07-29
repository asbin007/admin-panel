import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Status } from "./authSlice";
import { APIS } from "@/globals/http";
import { AppDispatch } from "./store";

export interface IReview {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  User?: {
    id: string;
    username: string;
  };
  Shoe?: {
    id: string;
    name: string;
    images: string;
  };
}

interface IReviews {
  items: IReview[];
  status: Status;
}

const initialState: IReviews = {
  items: [],
  status: Status.LOADING,
};

const reviewsSlice = createSlice({
  name: "reviews",
  initialState,
  reducers: {
    setReviews(state: IReviews, action: PayloadAction<IReview[]>) {
      state.items = action.payload;
    },
    setStatus(state: IReviews, action: PayloadAction<Status>) {
      state.status = action.payload;
    },
    addReview(state: IReviews, action: PayloadAction<IReview>) {
      state.items.unshift(action.payload);
    },
    updateReview(state: IReviews, action: PayloadAction<IReview>) {
      const index = state.items.findIndex((review) => review.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeReview(state: IReviews, action: PayloadAction<string>) {
      state.items = state.items.filter((review) => review.id !== action.payload);
    },
  },
});

export const {
  setReviews,
  setStatus,
  addReview,
  updateReview,
  removeReview,
} = reviewsSlice.actions;

export default reviewsSlice.reducer;

// Thunks
export function fetchAllReviews() {
  return async function fetchAllReviewsThunk(dispatch: AppDispatch) {
    try {
      dispatch(setStatus(Status.LOADING));
      const response = await APIS.get("/review");
      
      if (response.data.message === "Reviews retrieved successfully") {
        dispatch(setReviews(response.data.data));
        dispatch(setStatus(Status.SUCCESS));
      } else {
        dispatch(setStatus(Status.ERROR));
      }
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      dispatch(setStatus(Status.ERROR));
    }
  };
}

export function fetchReviewsByProduct(productId: string) {
  return async function fetchReviewsByProductThunk(dispatch: AppDispatch) {
    try {
      dispatch(setStatus(Status.LOADING));
      const response = await APIS.get(`/review/${productId}`);
      
      if (response.data.message === "Reviews retrieved successfully") {
        dispatch(setReviews(response.data.data));
        dispatch(setStatus(Status.SUCCESS));
      } else {
        dispatch(setStatus(Status.ERROR));
      }
    } catch (error: any) {
      console.error("Error fetching product reviews:", error);
      dispatch(setStatus(Status.ERROR));
    }
  };
}

export function deleteReview(reviewId: string) {
  return async function deleteReviewThunk(dispatch: AppDispatch) {
    try {
      const response = await APIS.delete(`/review/${reviewId}`);
      
      if (response.data.message === "Review deleted successfully") {
        dispatch(removeReview(reviewId));
        return { success: true };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error: any) {
      console.error("Error deleting review:", error);
      return { 
        success: false, 
        error: error.response?.data?.message || "Failed to delete review" 
      };
    }
  };
}

export function updateReviewById(reviewId: string, data: { rating: number; comment: string }) {
  return async function updateReviewThunk(dispatch: AppDispatch) {
    try {
      const response = await APIS.patch(`/review/${reviewId}`, data);
      
      if (response.data.message === "Review updated successfully") {
        dispatch(updateReview(response.data.data));
        return { success: true };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error: any) {
      console.error("Error updating review:", error);
      return { 
        success: false, 
        error: error.response?.data?.message || "Failed to update review" 
      };
    }
  };
} 