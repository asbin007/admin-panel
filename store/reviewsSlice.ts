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
    images: string | string[];
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
      
      // Try local Next.js API first
      try {
        const token = localStorage.getItem("tokenauth");
        const response = await fetch("/api/review", {
          headers: {
            'Authorization': token || '',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("✅ Reviews fetched successfully from Next.js API:", data);
        
        if (data.data) {
          dispatch(setReviews(data.data));
        } else {
          dispatch(setReviews([]));
        }
        
        dispatch(setStatus(Status.SUCCESS));
        return;
      } catch (localError) {
        console.log("⚠️ Local API failed, trying backend directly:", localError);
      }
      
      // Fallback to direct backend call
      const response = await APIS.get("/review");
      
      console.log("✅ Reviews fetched successfully:", response.data);
      
      if (response.data.data) {
        dispatch(setReviews(response.data.data));
      } else {
        dispatch(setReviews([]));
      }
      
      dispatch(setStatus(Status.SUCCESS));
    } catch (error: any) {
      console.error("❌ Error fetching reviews:", error);
      
      // Handle specific error types
      if (error.response) {
        console.error("📊 Error response status:", error.response.status);
        console.error("📊 Error response data:", error.response.data);
        
        if (error.response.status === 500) {
          console.error("🔥 Backend Internal Server Error - Reviews endpoint might not be implemented");
        } else if (error.response.status === 404) {
          console.error("🔍 Reviews API endpoint not found - Check if reviews feature is implemented");
        } else if (error.response.status === 401) {
          console.error("🔐 Authentication failed - Check token");
        }
      } else if (error.request) {
        console.error("🌐 Network error - Backend server might be down");
      } else {
        console.error("❓ Unknown error:", error.message);
      }
      
      dispatch(setStatus(Status.ERROR));
      // Set empty array as fallback
      dispatch(setReviews([]));
    }
  };
}

export function fetchReviewsByProduct(productId: string) {
  return async function fetchReviewsByProductThunk(dispatch: AppDispatch) {
    try {
      dispatch(setStatus(Status.LOADING));
      
      // Try local Next.js API first
      try {
        const token = localStorage.getItem("tokenauth");
        const response = await fetch(`/api/review/${productId}`, {
          headers: {
            'Authorization': token || '',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("✅ Product reviews fetched successfully from Next.js API:", data);
        
        if (data.data) {
          dispatch(setReviews(data.data));
        } else {
          dispatch(setReviews([]));
        }
        
        dispatch(setStatus(Status.SUCCESS));
        return;
      } catch (localError) {
        console.log("⚠️ Local API failed, trying backend directly:", localError);
      }
      
      // Fallback to direct backend call
      const response = await APIS.get(`/review/${productId}`);
      
      console.log("✅ Product reviews fetched successfully:", response.data);
      
      if (response.data.data) {
        dispatch(setReviews(response.data.data));
      } else {
        dispatch(setReviews([]));
      }
      
      dispatch(setStatus(Status.SUCCESS));
    } catch (error: any) {
      console.error("Error fetching product reviews:", error);
      dispatch(setStatus(Status.ERROR));
      dispatch(setReviews([]));
    }
  };
}

export function deleteReview(reviewId: string) {
  return async function deleteReviewThunk(dispatch: AppDispatch) {
    try {
      // Try local Next.js API first
      try {
        const token = localStorage.getItem("tokenauth");
        const response = await fetch(`/api/review/${reviewId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': token || '',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("✅ Review deleted successfully via Next.js API:", data);
        
        dispatch(removeReview(reviewId));
        return { success: true };
      } catch (localError) {
        console.log("⚠️ Local API failed, trying backend directly:", localError);
      }
      
      // Fallback to direct backend call
      const response = await APIS.delete(`/review/${reviewId}`);
      
      console.log("✅ Review deleted successfully:", response.data);
      
      dispatch(removeReview(reviewId));
      return { success: true };
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
      // Try local Next.js API first
      try {
        const token = localStorage.getItem("tokenauth");
        const response = await fetch(`/api/review/${reviewId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': token || '',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        if (responseData.message === "Review updated successfully") {
          dispatch(updateReview(responseData.data));
          return { success: true };
        } else {
          return { success: false, error: responseData.message };
        }
      } catch (localError) {
        console.log("⚠️ Local API failed, trying backend directly:", localError);
      }
      
      // Fallback to direct backend call
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