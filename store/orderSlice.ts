import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Status } from "./authSlice";
import { APIS } from "@/globals/http";
import { AppDispatch } from "./store";

export enum OrderStatus {
  Preparation = "preparation",
  Ontheway = "ontheway",
  Delivered = "delivered",
  Pending = "pending",
  Cancelled = "cancelled",
}

export enum PaymentMethod {
  Khalti = "khalti",
  Esewa = "esewa",
  COD = "cod",
}

export enum PaymentStatus {
  Paid = "paid",
  Unpaid = "unpaid",
}
export interface IOrderDetail {
  id: string;
  quantity: number;
  createdAt: string;
  orderId: string;
  productId: string;
  paymentId:string

  Order: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    addressLine: string;
    city: string;
    street: string;
    zipcode: string;
    status: OrderStatus;
    totalPrice: number;
    state: string;
    userId: string;

    Payment: {
    id:string
      paymentMethod: PaymentMethod;
      paymentStatus: PaymentStatus;
    };
  };

  Shoe: {
    images: string;
    name: string;
    price: number;
    Category: {
      categoryName: string;
    };
  };
}

interface IOrder {
  id: string;
  totalPrice: number;
  status: string;
  OrderDetail: {
    quantity: string;
    createdAt:string
  };
  Payment: {
    
    paymentMethod: string;
    paymentStatus: string;
  };
}
interface IIOrder {
  items: IOrder[];
  status: Status;
  orderDetails: IOrderDetail[];
}
const initialState: IIOrder = {
  items: [],
  status: Status.LOADING,
  orderDetails: [],
};
const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setItems(state: IIOrder, action: PayloadAction<IOrder[]>) {
      state.items = action.payload;
    },
    setOrderDetails(state: IIOrder, action: PayloadAction<IOrderDetail[]>) {
      state.orderDetails = action.payload;
    },
    setStatus(state: IIOrder, action: PayloadAction<Status>) {
      state.status = action.payload;
    },
    
  }
});
export default orderSlice.reducer;
const { setItems, setStatus, setOrderDetails } = orderSlice.actions;

export function fetchOrders() {
  return async function fetchOrdersThunk(dispatch: AppDispatch) {
    try {
      dispatch(setStatus(Status.LOADING));
      console.log("Fetching orders...");
      const response = await APIS.get("/order/all");
      console.log("Orders response:", response);
      if (response.status === 201) {
        dispatch(setStatus(Status.SUCCESS));
        dispatch(setItems(response.data.data));
        console.log("Orders data:", response.data.data);
      } else {
        console.log("Orders response status not 201:", response.status);
        dispatch(setStatus(Status.ERROR));
      }
    } catch (error) {
      console.log("Orders fetch error:", error);
      dispatch(setStatus(Status.ERROR));
    }
  };
}

export function fetchAdminOrderDetails(id: string) {
  return async function fetchAdminOrderDetailsThunk(dispatch: AppDispatch) {
    try {
      console.log("Fetching order details for ID:", id);
      const response = await APIS.get("/order/" + id);
      console.log("Order details response:", response);
      if (response.status === 200) {
        dispatch(setStatus(Status.SUCCESS));
        dispatch(setOrderDetails(response.data.data));
        console.log("Order details data:", response.data.data);
      } else {
        console.log("Order details response status not 200:", response.status);
        dispatch(setStatus(Status.ERROR));
      }
    } catch (error) {
      console.error("Order details fetch error:", error);
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'ERR_NETWORK') {
          console.error("❌ Backend server is not running. Please start your backend server on port 5001");
        }
      }
      dispatch(setStatus(Status.ERROR));
    }
  };
}
