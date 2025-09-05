import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppDispatch } from "./store";
import { APIS } from "../globals/http";
import { Status } from "./authSlice";

interface ICollection {
  id: string;
  collectionName: string;
}
interface ICollectionInitialState {
  collection: ICollection[];
  status: Status;
}

const initialState: ICollectionInitialState = {
  collection: [],
  status: Status.LOADING,
};
const categorySlice = createSlice({
  name: "collections",
  initialState,
  reducers: {
    setItems(
      state: ICollectionInitialState,
      action: PayloadAction<ICollection[]>
    ) {
      state.collection = action.payload;
    },

    setStatus(state: ICollectionInitialState, action: PayloadAction<Status>) {
      state.status = action.payload;
    },
  },
});
export const { setItems, setStatus } = categorySlice.actions;
export default categorySlice.reducer;

export function fetchCollection() {
  return async function fetchCollectionThunk(dispatch: AppDispatch) {
    try {
      console.log("Fetching collections from /collection endpoint...");
      const response = await APIS.get("/collection");
      
      console.log("Collections response:", response.status, response.data);
      
      if (response && (response.status === 200 || response.status === 201)) {
        const collections = response.data.data || response.data || [];
        console.log("Collections data:", collections);
        dispatch(setItems(collections));
        dispatch(setStatus(Status.SUCCESS));
      } else {
        console.log("Collections response not successful:", response);
        dispatch(setStatus(Status.ERROR));
        dispatch(setItems([]));
      }
    } catch (error: any) {
      console.error("Collection fetch error:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // If 404, try alternative endpoint
      if (error.response?.status === 404) {
        try {
          console.log("Trying /collections endpoint...");
          const response = await APIS.get("/collections");
          if (response && (response.status === 200 || response.status === 201)) {
            const collections = response.data.data || response.data || [];
            dispatch(setItems(collections));
            dispatch(setStatus(Status.SUCCESS));
            return;
          }
        } catch (secondError) {
          console.error("Second attempt failed:", secondError);
        }
      }
      
      dispatch(setStatus(Status.ERROR));
      dispatch(setItems([]));
    }
  };
}
