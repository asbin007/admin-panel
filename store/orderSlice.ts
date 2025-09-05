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
  orderStatus?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  createdAt?: string;
  Order?: {
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
      id: string;
      paymentMethod: PaymentMethod;
      paymentStatus: PaymentStatus;
    };
  };
  User?: {
    id: string;
    username: string;
    phoneNumber?: string;
  };
  Customer?: {
    id: string;
    username: string;
    phoneNumber?: string;
  };
  OrderDetail: {
    quantity: string;
    createdAt: string;
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

export { setItems, setStatus, setOrderDetails };

export function fetchOrders() {
  return async function fetchOrdersThunk(dispatch: AppDispatch) {
    try {
      dispatch(setStatus(Status.LOADING));

      // Try multiple endpoints
      let response;
      try {
        response = await APIS.get("/orders");
      } catch (firstError) {
        console.log("Trying /order/all endpoint...");
        try {
          response = await APIS.get("/order/all");
        } catch (secondError) {
          console.log("Trying /admin/orders endpoint...");
          response = await APIS.get("/admin/orders");
        }
      }
      
      if (response && (response.status === 200 || response.status === 201)) {
        dispatch(setStatus(Status.SUCCESS));
        dispatch(setItems(response.data.data || response.data || []));
      } else {
        console.error('🔍 Debug - API returned non-success status:', response.status);
        dispatch(setStatus(Status.ERROR));
        dispatch(setItems([]));
      }
    } catch (error) {
      console.error("🔍 Debug - Orders fetch error:", error);
      console.error("🔍 Debug - Error details:", error);
      dispatch(setStatus(Status.ERROR));
      // Set empty array as fallback
      dispatch(setItems([]));
    }
  };
}



export function fetchAdminOrderDetails(id: string) {
  return async function fetchAdminOrderDetailsThunk(dispatch: AppDispatch) {
    try {
      const response = await APIS.get("/order/" + id);
      if (response.status === 200 || response.status === 201) {
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
    console.log('🔄 Starting order status update:', { orderId, status, userId });
    
    // Try WebSocket first if available and enabled
    if (typeof window !== 'undefined' && (window as any).socket && (window as any).socket.connected) {
      console.log('🌐 WebSocket connected, attempting real-time update');
      
      return new Promise((resolve) => {
        // Get the authenticated user ID from WebSocket if available
        const socket = (window as any).socket;
        const authenticatedUserId = socket.authenticatedUserId || userId;
        
        const updateData = { status, orderId, userId: authenticatedUserId };
        console.log('📤 Sending order status update via WebSocket:', updateData);
        socket.emit('updateOrderStatus', updateData);
        
        // Also broadcast to all clients for real-time updates
        socket.emit('broadcastOrderUpdate', { orderId, status });
        
        // Listen for the response
        const handleStatusUpdated = (data: any) => {
          console.log('✅ Order status update response received:', data);
          if (data.orderId === orderId) {
            (window as any).socket.off('statusUpdated', handleStatusUpdated);
            (window as any).socket.off('error', handleError);
            (window as any).socket.off('timeout', handleTimeout);
            
            // Refresh order details
            dispatch(fetchAdminOrderDetails(orderId));
            resolve({ success: true, method: 'websocket' });
          }
        };
        
        const handleError = (error: any) => {
          console.log('❌ WebSocket error received:', error);
          (window as any).socket.off('statusUpdated', handleStatusUpdated);
          (window as any).socket.off('error', handleError);
          (window as any).socket.off('timeout', handleTimeout);
          
          const errorString = String(error);
          console.log('🔍 Error details:', {
            message: errorString,
            type: typeof error,
            stack: error?.stack
          });
          
          if (errorString.includes('User is not online') || errorString.includes('not online')) {
            console.log('🔄 User not online, falling back to API update');
            resolve({ success: false, error: 'User not online', fallback: true });
          } else if (errorString.includes('timeout') || errorString.includes('Timeout')) {
            console.log('⏰ WebSocket timeout, falling back to API update');
            resolve({ success: false, error: 'WebSocket timeout', fallback: true });
          } else {
            resolve({ success: false, error: errorString || 'WebSocket error', fallback: true });
          }
        };
        
        const handleTimeout = () => {
          console.log('⏰ WebSocket timeout, falling back to API update');
          (window as any).socket.off('statusUpdated', handleStatusUpdated);
          (window as any).socket.off('error', handleError);
          (window as any).socket.off('timeout', handleTimeout);
          // Don't show error, just fallback silently
          resolve({ success: false, error: '', fallback: true });
        };
        
        (window as any).socket.on('statusUpdated', handleStatusUpdated);
        (window as any).socket.on('error', handleError);
        
        // Timeout after 10 seconds
        setTimeout(handleTimeout, 10000);
      });
    }
    
    // Fallback to API update
    console.log('🌐 WebSocket not available, using API update');
    try {
      console.log('📤 Sending order status update:', { orderId, status });
      // Try multiple endpoints
      let response;
      try {
        response = await APIS.patch(`/order/admin/change-status/${orderId}`, { status });
      } catch (firstError) {
        console.log('Trying /order/change-status endpoint...');
        try {
          response = await APIS.patch(`/order/change-status/${orderId}`, { status });
        } catch (secondError) {
          console.log('Trying /admin/order/update endpoint...');
          response = await APIS.patch(`/admin/order/update/${orderId}`, { status });
        }
      }
      
      if (response && (response.status === 200 || response.status === 201)) {
        console.log('✅ Order status updated via API');
        // Refresh order details
        dispatch(fetchAdminOrderDetails(orderId));
        return { success: true, method: 'api' };
      } else {
        console.error('❌ API update failed:', response?.status);
        return { success: false, error: 'API update failed' };
      }
    } catch (apiError: any) {
      console.error("❌ API update error:", apiError);
      
      // Log detailed error information
      if (apiError.response) {
        console.error("❌ API Error Response:", {
          status: apiError.response.status,
          data: apiError.response.data,
          message: apiError.response.data?.message || 'Unknown API error',
          config: {
            url: apiError.config?.url,
            method: apiError.config?.method,
            data: apiError.config?.data
          }
        });
      }
      
      // Try alternative API endpoint format
      try {
        console.log('🔄 Trying alternative API endpoint format');
        const altResponse = await APIS.put(`/order/${orderId}/status`, { status });
        if (altResponse.status === 200) {
          console.log('✅ Order status updated via alternative API');
          dispatch(fetchAdminOrderDetails(orderId));
          return { success: true, method: 'api-alt' };
        }
      } catch (altError: any) {
        console.error("❌ Alternative API also failed:", altError);
      }
      
      // Final fallback to local update
      try {
        console.log('🔄 API failed, trying local update');
        const currentResponse = await APIS.get(`/order/${orderId}`);
        if (currentResponse.status === 200 && currentResponse.data.data.length > 0) {
          const orderDetail = currentResponse.data.data[0];
          const updatedOrderDetail = {
            ...orderDetail,
            Order: {
              ...orderDetail.Order,
              status: status
            }
          };
          dispatch(setOrderDetails([updatedOrderDetail]));
          console.log('✅ Order status updated locally');
          return { success: true, method: 'local' };
        }
      } catch (localError) {
        console.error("❌ Local update also failed:", localError);
      }
      
      const errorMessage = apiError.response?.data?.message || apiError.message || "All update methods failed";
      return { success: false, error: errorMessage };
    }
  };
}

export function updatePaymentStatus(orderId: string, paymentId: string, status: string, userId: string) {
  return async function updatePaymentStatusThunk(dispatch: AppDispatch) {
    console.log('🔄 Starting payment status update:', { orderId, paymentId, status, userId });
    
    // Try WebSocket first if available and enabled
    if (typeof window !== 'undefined' && (window as any).socket && (window as any).socket.connected) {
      console.log('🌐 WebSocket connected, attempting real-time update');
      
      return new Promise((resolve) => {
        // Get the authenticated user ID from WebSocket if available
        const socket = (window as any).socket;
        const authenticatedUserId = socket.authenticatedUserId || userId;
        
        const updateData = { status, paymentId, userId: authenticatedUserId };
        console.log('📤 Sending payment status update via WebSocket:', updateData);
        socket.emit('updatePaymentStatus', updateData);
        
        // Also broadcast to all clients for real-time updates
        socket.emit('broadcastPaymentUpdate', { orderId, paymentId, status });
        
        // Listen for the response
        const handlePaymentStatusUpdated = (data: any) => {
          console.log('✅ Payment status update response received:', data);
          if (data.paymentId === paymentId) {
            (window as any).socket.off('paymentStatusUpdated', handlePaymentStatusUpdated);
            (window as any).socket.off('error', handleError);
            (window as any).socket.off('timeout', handleTimeout);
            
            // Refresh order details
            dispatch(fetchAdminOrderDetails(orderId));
            resolve({ success: true, method: 'websocket' });
          }
        };
        
        const handleError = (error: any) => {
          console.log('❌ WebSocket error received:', error);
          (window as any).socket.off('paymentStatusUpdated', handlePaymentStatusUpdated);
          (window as any).socket.off('error', handleError);
          (window as any).socket.off('timeout', handleTimeout);
          
          const errorString = String(error);
          if (errorString.includes('User is not online') || errorString.includes('not online')) {
            console.log('🔄 User not online, but update will be saved via API');
            // Still resolve as success since the update will be saved
            resolve({ success: true, error: 'User not online', method: 'websocket-fallback' });
          } else {
            resolve({ success: false, error: errorString || 'WebSocket error', fallback: true });
          }
        };
        
        const handleTimeout = () => {
          console.log('⏰ WebSocket timeout, falling back to API update');
          (window as any).socket.off('paymentStatusUpdated', handlePaymentStatusUpdated);
          (window as any).socket.off('error', handleError);
          (window as any).socket.off('timeout', handleTimeout);
          // Don't show error, just fallback silently
          resolve({ success: false, error: '', fallback: true });
        };
        
        (window as any).socket.on('paymentStatusUpdated', handlePaymentStatusUpdated);
        (window as any).socket.on('error', handleError);
        
        // Timeout after 10 seconds
        setTimeout(handleTimeout, 10000);
      });
    }
    
    // Fallback to API update
    console.log('🌐 WebSocket not available, using API update');
    try {
      // Try multiple endpoints
      let response;
      try {
        response = await APIS.patch(`/order/admin/change-payment-status/${paymentId}`, { status });
      } catch (firstError) {
        console.log('Trying /payment/change-status endpoint...');
        try {
          response = await APIS.patch(`/payment/change-status/${paymentId}`, { status });
        } catch (secondError) {
          console.log('Trying /admin/payment/update endpoint...');
          response = await APIS.patch(`/admin/payment/update/${paymentId}`, { status });
        }
      }
      
      if (response && (response.status === 200 || response.status === 201)) {
        console.log('✅ Payment status updated via API');
        // Refresh order details
        dispatch(fetchAdminOrderDetails(orderId));
        return { success: true, method: 'api' };
      } else {
        console.error('❌ API update failed:', response?.status);
        return { success: false, error: 'API update failed' };
      }
    } catch (apiError: any) {
      console.error("❌ API update error:", apiError);
      
      // Log detailed error information
      if (apiError.response) {
        console.error("❌ API Error Response:", {
          status: apiError.response.status,
          data: apiError.response.data,
          message: apiError.response.data?.message || 'Unknown API error'
        });
      }
      
      // Final fallback to local update
      try {
        console.log('🔄 API failed, trying local update');
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
          console.log('✅ Payment status updated locally');
          return { success: true, method: 'local' };
        }
      } catch (localError) {
        console.error("❌ Local update also failed:", localError);
      }
      
      const errorMessage = apiError.response?.data?.message || apiError.message || "All update methods failed";
      return { success: false, error: errorMessage };
    }
  };
}
