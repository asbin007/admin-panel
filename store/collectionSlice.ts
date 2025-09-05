import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppDispatch } from "./store";
import { API } from "../globals/http";
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
      // Try multiple endpoints
      let response;
      try {
        response = await API.get("/collections");
      } catch (firstError) {
        console.log("Trying /collection endpoint...");
        try {
          response = await API.get("/collection");
        } catch (secondError) {
          console.log("Trying /admin/collections endpoint...");
          response = await API.get("/admin/collections");
        }
      }
      
      if (response && (response.status === 200 || response.status === 201)) {
        dispatch(setItems(response.data.data || response.data || []));
        dispatch(setStatus(Status.SUCCESS));
      } else {
        dispatch(setStatus(Status.ERROR));
        dispatch(setItems([]));
      }
    } catch (error) {
      console.log("Collection fetch error:", error);
      dispatch(setStatus(Status.ERROR));
      dispatch(setItems([]));
    }
  };
}
