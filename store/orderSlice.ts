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
      const response = await APIS.get("/order/" + id);
      if (response.status === 200) {
        dispatch(setStatus(Status.SUCCESS));
        dispatch(setOrderDetails(response.data.data));
        console.log("order details refreshed, payment status:", response.data.data[0]?.Order?.Payment?.paymentStatus);
      } else {
        dispatch(setStatus(Status.ERROR));
      }
    } catch (error) {
      console.error("Order details fetch error:", error);
      dispatch(setStatus(Status.ERROR));
    }
  };
}

export function updateOrderStatus(orderId: string, status: string, userId: string) {
  return async function updateOrderStatusThunk(dispatch: AppDispatch) {
    // Use WebSocket if available, otherwise fallback to local update
    if (typeof window !== 'undefined' && (window as any).socket && (window as any).socket.connected) {
      return new Promise((resolve) => {
        (window as any).socket.emit('updateOrderStatus', { status, orderId, userId });
        
        // Listen for the response
        const handleStatusUpdated = (data: any) => {
          if (data.orderId === orderId) {
            (window as any).socket.off('statusUpdated', handleStatusUpdated);
            dispatch(fetchAdminOrderDetails(orderId));
            resolve({ success: true });
          }
        };
        
        const handleError = (error: any) => {
          (window as any).socket.off('error', handleError);
          resolve({ success: false, error: error.message || 'WebSocket error' });
        };
        
        (window as any).socket.on('statusUpdated', handleStatusUpdated);
        (window as any).socket.on('error', handleError);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          (window as any).socket.off('statusUpdated', handleStatusUpdated);
          (window as any).socket.off('error', handleError);
          resolve({ success: false, error: 'WebSocket timeout' });
        }, 5000);
      });
    } else {
      // Fallback to local update if WebSocket is not available
      try {
        const currentResponse = await APIS.get(`/order/${orderId}`);
        if (currentResponse.status === 200 && currentResponse.data.data.length > 0) {
          const orderDetail = currentResponse.data.data[0];
          const updatedOrderDetail = {
            ...orderDetail,
            Order: {
              ...orderDetail.Order,
              orderStatus: status
            }
          };
          dispatch(setOrderDetails([updatedOrderDetail]));
          return { success: true, simulated: true };
        }
      } catch (fallbackError) {
        console.error("fallback update failed:", fallbackError);
      }
      
      return { success: false, error: "WebSocket not available and fallback failed" };
    }
  };
}

export function updatePaymentStatus(orderId: string, paymentId: string, status: string) {
  return async function updatePaymentStatusThunk(dispatch: AppDispatch) {
    // Use WebSocket if available, otherwise fallback to local update
    if (typeof window !== 'undefined' && (window as any).socket && (window as any).socket.connected) {
      return new Promise((resolve) => {
        (window as any).socket.emit('updatePaymentStatus', { status, paymentId, userId: orderId });
        
        // Listen for the response
        const handlePaymentStatusUpdated = (data: any) => {
          if (data.paymentId === paymentId) {
            (window as any).socket.off('paymentStatusUpdated', handlePaymentStatusUpdated);
            dispatch(fetchAdminOrderDetails(orderId));
            resolve({ success: true });
          }
        };
        
        const handleError = (error: any) => {
          (window as any).socket.off('error', handleError);
          resolve({ success: false, error: error.message || 'WebSocket error' });
        };
        
        (window as any).socket.on('paymentStatusUpdated', handlePaymentStatusUpdated);
        (window as any).socket.on('error', handleError);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          (window as any).socket.off('paymentStatusUpdated', handlePaymentStatusUpdated);
          (window as any).socket.off('error', handleError);
          resolve({ success: false, error: 'WebSocket timeout' });
        }, 5000);
      });
    } else {
      // Fallback to local update if WebSocket is not available
      try {
        const currentResponse = await APIS.get(`/order/${orderId}`);
        if (currentResponse.status === 200 && currentResponse.data.data.length > 0) {
          const orderDetail = currentResponse.data.data[0];
          const updatedOrderDetail = {
            ...orderDetail,
            Order: {
              ...orderDetail.Order,
              Payment: {
                ...orderDetail.Order.Payment,
                paymentStatus: status
              }
            }
          };
          dispatch(setOrderDetails([updatedOrderDetail]));
          return { success: true, simulated: true };
        }
      } catch (fallbackError) {
        console.error("fallback update failed:", fallbackError);
      }
      
      return { success: false, error: "WebSocket not available and fallback failed" };
    }
  };
}
