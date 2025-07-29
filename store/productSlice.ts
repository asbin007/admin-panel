import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "./store";
import { APIS } from "../globals/http";
import { Status } from "./authSlice";
import { IProduct } from "@/app/products/types";

interface IProducts {
  products: IProduct[];
  status: Status;
  product: IProduct | null;
}

const initialState: IProducts = {
  products: [],
  status: Status.LOADING,
  product: null,
};
const productSlice = createSlice({
  name: "adminProducts",
  initialState,
  reducers: {
    setProducts(state: IProducts, action: PayloadAction<IProduct[]>) {
      state.products = action.payload;
    },
    setStatus(state: IProducts, action: PayloadAction<Status>) {
      state.status = action.payload;
    },
    addProductToProducts(state: IProducts, action: PayloadAction<IProduct>) {
      state.products.push(action.payload);
    },
    setProduct(state: IProducts, action: PayloadAction<IProduct>) {
      state.product = action.payload;
    },
    updateProduct(state: IProducts, action: PayloadAction<IProduct>) {
      const index = state.products.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = action.payload;
      }
      state.status = Status.SUCCESS;
    },
    removeProduct(state: IProducts, action: PayloadAction<string>) {
      state.products = state.products.filter((p) => p.id !== action.payload);
      state.status = Status.SUCCESS;
    },
  },
});

export const {
  setStatus,
  setProduct,
  setProducts,
  addProductToProducts,
  updateProduct,
  removeProduct,
} = productSlice.actions;
export default productSlice.reducer;

export function addProduct(data: FormData) {
  return async function addProductThunk(dispatch: AppDispatch) {
    try {
      const res = await APIS.post("/product", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.status === 201) {
        dispatch(setStatus(Status.SUCCESS));
        dispatch(addProductToProducts(res.data.data));
      } else {
        dispatch(setStatus(Status.ERROR));
      }
    } catch (error) {
      dispatch(setStatus(Status.ERROR));
      console.log(error);
    }
  };
}

export function fetchProducts() {
  return async function fetchProductsThunk(dispatch: AppDispatch) {
    try {
      const response = await APIS.get("/product");
      if (response.status === 200) {
        dispatch(setProducts(response.data.data));
      } else {
        dispatch(setStatus(Status.ERROR));
      }
    } catch (error) {
      console.log(error);

      dispatch(setStatus(Status.ERROR));
    }
  };
}

export function fetchProductAdmin(id: string) {
  return async function fetchProductAdminThunk(
    dispatch: AppDispatch,
    getState: () => RootState
  ) {
    const store = getState();
    const productExists = store.adminProducts.products.find(
      (product: IProduct) => product.id == id
    );

    if (productExists) {
      dispatch(setProduct(productExists));
      dispatch(setStatus(Status.SUCCESS));
    } else {
      try {
        const response = await APIS.get("/product/" + id);
        if (response.status === 200) {
          dispatch(setStatus(Status.SUCCESS));
          dispatch(setProduct(response.data.data));
        } else {
          dispatch(setStatus(Status.ERROR));
        }
      } catch (error) {
        console.log(error);
        dispatch(setStatus(Status.ERROR));
      }
    }
  };
}

export function deleteProduct(id: string) {
  return async function deleteProductThunk(dispatch: AppDispatch) {
    try {
      const res = await APIS.delete(`/product/${id}`);
      if (res.status === 201) {
        // Backend uses 201, ideally should be 204
        dispatch(removeProduct(id));
        return res.data;
      } else {
        dispatch(setStatus(Status.ERROR));
        throw new Error(res.data.message || "Failed to delete product");
      }
    } catch (error: any) {
      dispatch(setStatus(Status.ERROR));
      throw new Error(
        error.response?.data?.message || "Failed to delete product"
      );
    }
  };
}

export function updateProducts(id: string, data: FormData) {
  return async function updateProductsThunk(dispatch: AppDispatch) {
    try {
      const res = await APIS.patch(`/product/${id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.status === 200) {
        dispatch(updateProduct(res.data.data));
        return res.data;
      } else {
        dispatch(setStatus(Status.ERROR));
        throw new Error(res.data.message || "Failed to update product");
      }
    } catch (error: any) {
      dispatch(setStatus(Status.ERROR));
      throw new Error(
        error.response?.data?.message || "Failed to update product"
      );
    }
  };
}
