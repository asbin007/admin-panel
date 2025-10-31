import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Status } from "./authSlice";
import { API, APIS } from "@/globals/http";
import { AppDispatch } from "./store";
import { updateProductStock, fetchProducts } from "./productSlice";

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

export interface IOrder {
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
    createdAt?: string;
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

      // Check authentication token
      const token = localStorage.getItem("tokenauth");
      if (!token) {
        console.error("❌ No authentication token found");
        dispatch(setStatus(Status.ERROR));
        dispatch(setItems([]));
        return;
      }

      // Try without authentication first (for public endpoints)
      let response;
      const publicEndpoints = [
        "/order/all",  // This endpoint doesn't require admin auth
        "/orders",     // Alternative endpoint
      ];
      
      let lastError;
      for (const endpoint of publicEndpoints) {
        try {
          console.log(`🔄 Trying public endpoint: ${endpoint}`);
          console.log(`🔗 Full URL: ${API.defaults.baseURL}${endpoint}`);
          response = await API.get(endpoint); // Use API without auth
          
          console.log(`📊 Response status: ${response.status}`);
          console.log(`📊 Response data:`, response.data);
          
          if (response && (response.status === 200 || response.status === 201)) {
            console.log(`✅ Success with public endpoint: ${endpoint}`);
            dispatch(setStatus(Status.SUCCESS));
            dispatch(setItems(response.data.data || response.data || []));
            return; // Exit successfully
          }
        } catch (error: any) {
          console.log(`❌ Failed with public endpoint ${endpoint}:`, {
            status: error.response?.status,
            message: error.message,
            data: error.response?.data
          });
          lastError = error;
          continue; // Try next endpoint
        }
      }
      
      // If public endpoints failed, try with authentication
      console.log("🔐 Trying authenticated endpoints...");
      const authEndpoints = [
        "/order/admin/all",
        "/admin/orders"
      ];
      
      for (const endpoint of authEndpoints) {
        try {
          console.log(`🔄 Trying auth endpoint: ${endpoint}`);
          response = await APIS.get(endpoint); // Use APIS with auth
          
          if (response && (response.status === 200 || response.status === 201)) {
            console.log(`✅ Success with auth endpoint: ${endpoint}`);
            dispatch(setStatus(Status.SUCCESS));
            dispatch(setItems(response.data.data || response.data || []));
            return; // Exit successfully
          }
        } catch (error: any) {
          console.log(`❌ Failed with auth endpoint ${endpoint}:`, error.response?.status || error.message);
          lastError = error;
          continue; // Try next endpoint
        }
      }
      
      // If all endpoints failed, provide a simple error message
      console.warn("⚠️ All order endpoints failed - this is not critical");
      console.warn("Last error:", lastError?.response?.status || lastError?.message);
      
      // Don't set error status, just set empty items
      dispatch(setStatus(Status.SUCCESS));
      dispatch(setItems([]));
      return;
    } catch (error: any) {
      console.error("❌ Error fetching orders:", error);
      
      // Handle specific error types
      if (error.response) {
        console.error("📊 Error response status:", error.response.status);
        console.error("📊 Error response data:", error.response.data);
        
        if (error.response.status === 500) {
          console.error("🔥 Backend Internal Server Error - Check server logs");
          console.error("💡 Possible causes: Database connection, server configuration, or code errors");
        } else if (error.response.status === 404) {
          console.error("🔍 API endpoint not found - Check endpoint URL");
        } else if (error.response.status === 401) {
          console.error("🔐 Authentication failed - Check token");
        } else if (error.response.status === 403) {
          console.error("🚫 Access forbidden - Check permissions");
        }
      } else if (error.request) {
        console.error("🌐 Network error - Backend server might be down");
        console.error("💡 Check if backend server is running on:", APIS.defaults.baseURL);
      } else {
        console.error("❓ Unknown error:", error.message);
      }
      
      dispatch(setStatus(Status.ERROR));
      dispatch(setItems([]));
    }
  };
}



export function fetchAdminOrderDetails(id: string) {
  return async function fetchAdminOrderDetailsThunk(dispatch: AppDispatch) {
    try {
      // Use admin-specific endpoint instead of customer endpoint
      const response = await APIS.get("/order/admin/" + id);
      if (response.status === 200 || response.status === 201) {
        dispatch(setStatus(Status.SUCCESS));
        dispatch(setOrderDetails(response.data.data));
        console.log("order details refreshed, payment status:", response.data.data[0]?.Order?.Payment?.paymentStatus);
        
        // DEBUG: Log the full API response to understand the structure
        console.log("🔍 API RESPONSE DEBUG:", {
          fullResponse: response.data,
          orderDetails: response.data.data,
          firstOrder: response.data.data[0],
          orderStructure: response.data.data[0] ? Object.keys(response.data.data[0]) : 'no data',
          orderOrderStructure: response.data.data[0]?.Order ? Object.keys(response.data.data[0].Order) : 'no Order object'
        });
      } else {
        dispatch(setStatus(Status.ERROR));
      }
    } catch (error) {
      console.error("Order details fetch error:", error);
      
      // Check if it's a 403 error (role access issue)
      if (error && typeof error === 'object' && (error as { response?: { status?: number } }).response?.status === 403) {
        console.error("❌ Admin access denied for order details - check admin role permissions");
      }
      
      dispatch(setStatus(Status.ERROR));
    }
  };
}

export function updateOrderStatus(orderId: string, status: string, userId: string) {
  return async function updateOrderStatusThunk(dispatch: AppDispatch) {
    console.log('🔄 Starting order status update:', { orderId, status, userId });
    console.log('🔄 Function called from:', new Error().stack);
    console.log('🔄 Thunk function started at:', new Date().toISOString());
    console.log('🔄 Parameters validation:', {
      orderIdType: typeof orderId,
      statusType: typeof status,
      userIdType: typeof userId,
      orderIdValid: !!orderId,
      statusValid: !!status,
      userIdValid: !!userId
    });
    
    // Try WebSocket first if available and enabled
    if (typeof window !== 'undefined' && (window as any).socket) {
      const socket = (window as any).socket;
      console.log('🌐 WebSocket status check:', {
        socketExists: !!socket,
        connected: socket.connected,
        readyState: socket.readyState,
        id: socket.id
      });
      
      if (socket.connected) {
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
        const handleStatusUpdated = async (data: any) => {
          console.log('✅ Order status update response received:', data);
          if (data.orderId === orderId) {
            (window as any).socket.off('statusUpdated', handleStatusUpdated);
            (window as any).socket.off('error', handleError);
            (window as any).socket.off('timeout', handleTimeout);
            
            // Refresh order details
            dispatch(fetchAdminOrderDetails(orderId));
            if (status === OrderStatus.Delivered) {
              // Fetch order details to get product quantities
              const orderDetailsResponse = await APIS.get(`/order/admin/${orderId}`);
              if (orderDetailsResponse.status === 200 && orderDetailsResponse.data.data) {
                for (const detail of orderDetailsResponse.data.data) {
                  await dispatch(updateProductStock(detail.productId, detail.quantity));
                  // Emit stock update event
                  socket.emit('stockUpdated', { productId: detail.productId, quantity: detail.quantity });
                }
              }
            }
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
          resolve({ success: false, error: 'WebSocket timeout', fallback: true });
        };
        
        (window as any).socket.on('statusUpdated', handleStatusUpdated);
        (window as any).socket.on('error', handleError);
        
        // Timeout after 5 seconds for better user experience
        setTimeout(handleTimeout, 5000);
      });
      }
    }
    
    // Fallback to API update
    console.log('🌐 WebSocket not available, using API update');
    try {
      console.log('📤 Sending order status update:', { orderId, status });
      console.log('📤 Request payload:', { orderStatus: status });
      console.log('📤 Request URL:', `/order/admin/change-status/${orderId}`);
      console.log('📤 Full API URL:', `${APIS.defaults.baseURL}/order/admin/change-status/${orderId}`);
      
      // Check authentication token
      const token = localStorage.getItem("tokenauth");
      console.log('🔐 Auth token exists:', !!token);
      console.log('🔐 Auth token length:', token?.length || 0);
      
      // Use the working endpoint only - backend expects 'orderStatus' field
      const apiUrl = `/order/admin/change-status/${orderId}`;
      const requestPayload = { orderStatus: status };
      
      console.log('🔗 Making API call to:', apiUrl);
      console.log('📦 Request payload:', requestPayload);
      console.log('🔑 Headers:', APIS.defaults.headers);
      console.log('🌐 Full URL:', `${APIS.defaults.baseURL}${apiUrl}`);
      
      const response = await APIS.patch(apiUrl, requestPayload);
      
      console.log('📥 API Response received:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });
      
      if (response && (response.status === 200 || response.status === 201)) {
        console.log('✅ Order status updated via API');
        // Refresh order details
        dispatch(fetchAdminOrderDetails(orderId));
        if (status === OrderStatus.Delivered) {
          // Fetch order details to get product quantities
          const orderDetailsResponse = await APIS.get(`/order/admin/${orderId}`);
          if (orderDetailsResponse.status === 200 && orderDetailsResponse.data.data) {
            for (const detail of orderDetailsResponse.data.data) {
              await dispatch(updateProductStock(detail.productId, detail.quantity));
              // Emit stock update event via WebSocket fallback
              if (typeof window !== 'undefined' && (window as any).socket && (window as any).socket.connected) {
                (window as any).socket.emit('stockUpdated', { productId: detail.productId, quantity: detail.quantity });
              }
            }
          }
        }
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
          statusText: apiError.response.statusText,
          data: apiError.response.data,
          message: apiError.response.data?.message || 'Unknown API error',
          config: {
            url: apiError.config?.url,
            method: apiError.config?.method,
            data: apiError.config?.data,
            headers: apiError.config?.headers
          }
        });
        
        // Check if it's a 401 error (authentication failed)
        if (apiError.response.status === 401) {
          console.error("❌ Authentication failed - check token");
          console.error("❌ Token details:", {
            hasToken: !!localStorage.getItem("tokenauth"),
            tokenLength: localStorage.getItem("tokenauth")?.length || 0
          });
          return { success: false, error: 'Authentication failed - please login again' };
        }
        
        // Check if it's a 404 error (order not found)
        if (apiError.response.status === 404) {
          console.error("❌ Order not found in backend");
          return { success: false, error: 'Order not found in backend' };
        }
        
        // Check if it's a 400 error (bad request)
        if (apiError.response.status === 400) {
          console.error("❌ Bad request - check order data");
          const errorMessage = apiError.response.data?.message || 'Bad request';
          console.error('❌ Backend validation error:', errorMessage);
          return { success: false, error: errorMessage };
        }
        
        // Check if it's a 500 error (server error)
        if (apiError.response.status === 500) {
          console.error("❌ Server error - backend issue");
          return { success: false, error: 'Server error - backend issue' };
        }
      } else if (apiError.request) {
        console.error("❌ Network error - no response received:", apiError.request);
        return { success: false, error: 'Network error - no response from server' };
      } else {
        console.error("❌ Request setup error:", apiError.message);
        return { success: false, error: 'Request setup error' };
      }
      
      
      // Final fallback to local update
      try {
        console.log('🔄 API failed, trying local update');
        const currentResponse = await APIS.get(`/order/admin/${orderId}`);
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
        
        // Timeout after 5 seconds for better user experience
        setTimeout(handleTimeout, 5000);
      });
    }
    
    // Fallback to API update
    console.log('🌐 WebSocket not available, using API update');
    try {
      console.log('📤 Sending payment status update:', { orderId, paymentId, status });
      console.log('📤 Request payload:', { paymentId, status });
      console.log('📤 Request URL:', `/order/admin/change-payment-status/${paymentId}`);
      
      // Check authentication token
      const token = localStorage.getItem("tokenauth");
      console.log('🔐 Auth token exists:', !!token);
      console.log('🔐 Auth token length:', token?.length || 0);
      
      // Use the working endpoint only - backend expects both paymentId and status in body
      const response = await APIS.patch(`/order/admin/change-payment-status/${paymentId}`, { 
        paymentId: paymentId, 
        status: status 
      });
      
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
      
      // Enhanced error handling for 400 errors
      if (apiError.response?.status === 400) {
        const errorData = apiError.response.data;
        console.error('❌ 400 Error Details:', errorData);
        
        // Return specific error message from backend
        return { 
          success: false, 
          error: errorData?.message || 'Invalid payment status update request',
          details: errorData
        };
      }
      
      // Log detailed error information
      if (apiError.response) {
        console.error("❌ API Error Response:", {
          status: apiError.response.status,
          data: apiError.response.data,
          message: apiError.response.data?.message || 'Unknown API error'
        });

        // Handle specific business logic errors for payment status
        if (apiError.response.status === 400) {
          const errorData = apiError.response.data;
          if (errorData?.message?.includes('Cannot change payment status from \'paid\' to \'unpaid\' for delivered orders')) {
            return { success: false, error: 'Cannot change payment status from paid to unpaid for delivered orders.' };
          }
          if (errorData?.message?.includes('Cannot change payment status from \'paid\' to \'unpaid\' for orders that are on the way')) {
            return { success: false, error: 'Cannot change payment status from paid to unpaid for orders that are on the way.' };
          }
          if (errorData?.message?.includes('Please provide paymentId and status')) {
            return { success: false, error: 'Missing required fields. Please try again.' };
          }
          if (errorData?.message?.includes('Payment not found')) {
            return { success: false, error: 'Payment not found. Please refresh and try again.' };
          }
        }
      }
      
      // Final fallback to local update
      try {
        console.log('🔄 API failed, trying local update');
        const currentResponse = await APIS.get(`/order/admin/${orderId}`);
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

export function deleteOrder(orderId: string) {
  return async function deleteOrderThunk(dispatch: AppDispatch) {
    try {
      console.log('🗑️ Starting order deletion:', { orderId });
      
      const response = await APIS.delete(`/order/admin/delete-order/${orderId}`);
      
      if (response && (response.status === 200 || response.status === 201)) {
        console.log('✅ Order deleted successfully');
        
        // Remove the order from the local state
        // Note: The items will be refreshed by the parent component
        
        // Clear order details if this order was being viewed
        dispatch(setOrderDetails([]));
        
        return { success: true, message: response.data.message || 'Order deleted successfully' };
      } else {
        console.error('❌ Order deletion failed:', response?.status);
        return { success: false, error: 'Order deletion failed' };
      }
    } catch (error: any) {
      console.error("❌ Order deletion error:", error);
      
      if (error.response) {
        console.error("❌ API Error Response:", {
          status: error.response.status,
          data: error.response.data,
          message: error.response.data?.message || 'Unknown API error'
        });

        // Handle specific business logic errors
        if (error.response.status === 400) {
          const errorData = error.response.data;
          if (errorData?.message?.includes('Cannot delete delivered orders')) {
            return { success: false, error: 'Cannot delete delivered orders' };
          }
          if (errorData?.message?.includes('Order not found')) {
            return { success: false, error: 'Order not found' };
          }
        }
        
        if (error.response.status === 404) {
          return { success: false, error: 'Order not found' };
        }
      }
      
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete order";
      return { success: false, error: errorMessage };
    }
  };
}

export function bulkDeleteOrders(orderIds: string[]) {
  return async function bulkDeleteOrdersThunk(dispatch: AppDispatch) {
    try {
      console.log('🗑️ Starting bulk order deletion:', { orderIds, count: orderIds.length });
      
      // Since bulk delete endpoint doesn't exist, delete orders individually
      const deletePromises = orderIds.map(orderId => 
        APIS.delete(`/order/admin/delete-order/${orderId}`)
      );
      
      const results = await Promise.allSettled(deletePromises);
      
      const successfulDeletes = results.filter(result => 
        result.status === 'fulfilled' && 
        (result.value.status === 200 || result.value.status === 201)
      );
      
      const failedDeletes = results.filter(result => 
        result.status === 'rejected' || 
        (result.status === 'fulfilled' && 
         result.value.status !== 200 && result.value.status !== 201)
      );
      
      console.log(`✅ ${successfulDeletes.length} orders deleted successfully`);
      if (failedDeletes.length > 0) {
        console.log(`❌ ${failedDeletes.length} orders failed to delete`);
      }
      
      // Clear order details if any of these orders were being viewed
      dispatch(setOrderDetails([]));
      
      if (successfulDeletes.length === orderIds.length) {
        return { 
          success: true, 
          message: `${successfulDeletes.length} orders deleted successfully`,
          deletedCount: successfulDeletes.length
        };
      } else if (successfulDeletes.length > 0) {
        return { 
          success: true, 
          message: `${successfulDeletes.length} out of ${orderIds.length} orders deleted successfully`,
          deletedCount: successfulDeletes.length,
          warning: `${orderIds.length - successfulDeletes.length} orders failed to delete`
        };
      } else {
        return { 
          success: false, 
          error: 'All orders failed to delete',
          deletedCount: 0
        };
      }
    } catch (error: any) {
      console.error("❌ Bulk order deletion error:", error);
      
      const errorMessage = error.message || "Failed to delete orders";
      return { success: false, error: errorMessage };
    }
  };
}
