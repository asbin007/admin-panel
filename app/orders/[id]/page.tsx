"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
} from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAdminOrderDetails, updateOrderStatus, updatePaymentStatus, OrderStatus, PaymentStatus } from "@/store/orderSlice";
import { getWebSocketStatus } from "@/utils/websocketFallback";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AdminLayout from "@/app/adminLayout/adminLayout";
import OrderStatusManager from "@/components/OrderStatusManager";

function AdminOrderDetail() {
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const { orderDetails, status } = useAppSelector((store) => store.orders);
  const [localOrderStatus, setLocalOrderStatus] = useState<string>('');
  const [localPaymentStatus, setLocalPaymentStatus] = useState<string>('');

  // Fetch order details when the page loads
  useEffect(() => {
    if (id && typeof id === 'string') {
      dispatch(fetchAdminOrderDetails(id));
    }
  }, [id, dispatch]);

  // Sync local state with order details
  useEffect(() => {
    if (orderDetails.length > 0) {
      const order = orderDetails[0];
      setLocalOrderStatus(order.Order?.status || 'pending');
      setLocalPaymentStatus(order.Order?.Payment?.paymentStatus || 'unpaid');
    }
  }, [orderDetails]);

  // Real-time WebSocket listeners for order updates
  useEffect(() => {
    console.log('🔍 OrderDetail: Setting up WebSocket listeners for order:', id);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).socket) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const socket = (window as any).socket;
      
      console.log('🔍 OrderDetail: Socket found:', !!socket);
      console.log('🔍 OrderDetail: Socket connected:', socket.connected);
      console.log('🔍 OrderDetail: Socket ID:', socket.id);
      
      const handleOrderStatusUpdate = (data: unknown) => {
        console.log('🔄 OrderDetail: Real-time order status update received:', data);
        const orderData = data as { orderId?: string };
        console.log('🔄 OrderDetail: Received orderId:', orderData.orderId, 'Current orderId:', id);
        if (orderData.orderId === id) {
          console.log('🔄 OrderDetail: Refreshing order details for order:', id);
          // Refresh order details to get latest data
          dispatch(fetchAdminOrderDetails(id as string));
        }
      };

      const handlePaymentStatusUpdate = (data: unknown) => {
        console.log('💰 OrderDetail: Real-time payment status update received:', data);
        const paymentData = data as { orderId?: string };
        console.log('💰 OrderDetail: Received orderId:', paymentData.orderId, 'Current orderId:', id);
        if (paymentData.orderId === id) {
          console.log('💰 OrderDetail: Refreshing order details for order:', id);
          // Refresh order details to get latest data
          dispatch(fetchAdminOrderDetails(id as string));
        }
      };

      // Listen for order status updates
      console.log('🔍 OrderDetail: Adding WebSocket listeners...');
      socket.on('orderStatusUpdated', handleOrderStatusUpdate);
      socket.on('statusUpdated', handleOrderStatusUpdate);
      socket.on('paymentStatusUpdated', handlePaymentStatusUpdate);
      
      // Test WebSocket connection
      socket.emit('test', { message: 'OrderDetail connected', orderId: id });

      return () => {
        console.log('🔍 OrderDetail: Cleaning up WebSocket listeners...');
        socket.off('orderStatusUpdated', handleOrderStatusUpdate);
        socket.off('statusUpdated', handleOrderStatusUpdate);
        socket.off('paymentStatusUpdated', handlePaymentStatusUpdate);
      };
    } else {
      console.warn('⚠️ OrderDetail: WebSocket not available');
    }
  }, [id, dispatch]);



  const handleOrderStatusChange = async (value: string) => {
    if (id && typeof id === 'string' && orderDetails.length > 0) {
      try {
        // Get admin user ID from localStorage
        const userDataString = localStorage.getItem('userData');
        const userData = userDataString ? JSON.parse(userDataString) : null;
        const adminUserId = userData?.id || userData?.email; // Use email as fallback
        
        console.log('🔄 Updating order status to:', value);
        console.log('👤 Admin User ID:', adminUserId);
        
        // Use the updated order status function with better error handling
        const result = await dispatch(updateOrderStatus(id, value as OrderStatus, adminUserId)) as { success: boolean; error?: string; method?: string };
        
        if (result.success) {
          console.log(`✅ Order status updated successfully via ${result.method || 'API'}`);
          // Update local state immediately
          setLocalOrderStatus(value);
          // Refresh order details to get latest data
          dispatch(fetchAdminOrderDetails(id));
          return { success: true };
        } else if (result.error && result.error !== 'WebSocket timeout') {
          // Only show error if it's not a WebSocket timeout
          console.error('❌ Failed to update order status:', result.error);
          return { success: false, error: result.error || 'Unknown error' };
        }
        
        return { success: true }; // WebSocket timeout is handled silently
      } catch (error) {
        console.error('❌ Error updating order status:', error);
        return { success: false, error: 'Failed to update order status. Please try again.' };
      }
    }
    return { success: false, error: 'Invalid order ID or no order details' };
  };

  const handlePaymentStatusChange = async (value: string) => {
    if (id && typeof id === 'string' && orderDetails.length > 0) {
      try {
        const paymentId = orderDetails[0].Order?.Payment?.id;
        
        if (!paymentId) {
          console.error('❌ Payment ID not found in order details');
          return { success: false, error: 'Payment ID not found in order details' };
        }
        
        // Get admin user ID from localStorage
        const userDataString = localStorage.getItem('userData');
        const userData = userDataString ? JSON.parse(userDataString) : null;
        const adminUserId = userData?.id || userData?.email; // Use email as fallback
        
        console.log('🔄 Updating payment status to:', value);
        console.log('💰 Payment ID:', paymentId);
        console.log('👤 Admin User ID:', adminUserId);
        
        // Use the updated payment status function with better error handling
        const result = await dispatch(updatePaymentStatus(id, paymentId, value as PaymentStatus, adminUserId)) as { success: boolean; error?: string; method?: string };
        
        if (result.success) {
          console.log(`✅ Payment status updated successfully via ${result.method || 'API'}`);
          // Update local state immediately
          setLocalPaymentStatus(value);
          // Refresh order details to get latest data
          dispatch(fetchAdminOrderDetails(id));
          return { success: true };
        } else if (result.error && result.error !== 'WebSocket timeout') {
          // Only show error if it's not a WebSocket timeout
          console.error('❌ Failed to update payment status:', result.error);
          return { success: false, error: result.error || 'Unknown error' };
        }
        
        return { success: true }; // WebSocket timeout is handled silently
      } catch (error) {
        console.error('❌ Error updating payment status:', error);
        return { success: false, error: 'Failed to update payment status. Please try again.' };
      }
    }
    return { success: false, error: 'Invalid order ID or no order details' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case OrderStatus.Preparation:
        return <Badge className="bg-blue-500">Preparation</Badge>;
      case OrderStatus.Ontheway:
        return <Badge className="bg-yellow-500">On the way</Badge>;
      case OrderStatus.Delivered:
        return <Badge className="bg-green-500">Delivered</Badge>;
      case OrderStatus.Cancelled:
        return <Badge variant="destructive">Cancelled</Badge>;
      case OrderStatus.Pending:
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case PaymentStatus.Paid:
        return <Badge className="bg-green-500">Paid</Badge>;
      case PaymentStatus.Unpaid:
      default:
        return <Badge variant="destructive">Unpaid</Badge>;
    }
  };

  // Loading state
  if (status === "loading" || !orderDetails.length) {
  return (
    <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/orders" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Link>
          </div>
          <Card>
            <CardContent className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading order details...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (status === "error") {
                  return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/orders" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Link>
                      </div>
          <Card>
            <CardContent className="flex justify-center items-center h-64">
              <div className="text-center">
                <p className="text-destructive mb-2">Error loading order details</p>
                <p className="text-sm text-muted-foreground mb-4">
                  This might be because the backend server is not running.
                  <br />
                  Please ensure your backend server is running on port 5001.
                </p>
                <button 
                  onClick={() => id && typeof id === 'string' && dispatch(fetchAdminOrderDetails(id))}
                  className="text-sm text-primary hover:underline"
                >
                  Try again
                </button>
                          </div>
            </CardContent>
          </Card>
                        </div>
      </AdminLayout>
    );
  }

  const order = orderDetails[0];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/orders" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Link>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold tracking-tight">
                Order #{order.orderId}
              </h1>
              {getStatusBadge(order.Order.status)}
              <Badge 
                variant={getWebSocketStatus() === 'connected' ? "default" : "secondary"} 
                className="text-xs"
              >
                {getWebSocketStatus() === 'connected' ? "🟢 Live" : "🟡 Local"}
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderDetails.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <img
                        src={item.Shoe?.images?.[0]
                          ? `https://res.cloudinary.com/dxpe7jikz/image/upload/v1750340657${
                              item.Shoe.images[0].startsWith("/uploads")
                                ? item.Shoe.images[0].replace("/uploads", "")
                                : item.Shoe.images[0]
                            }.jpg`
                          : '/placeholder-image.svg'
                        }
                        alt={item.Shoe.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-image.svg';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.Shoe.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Category: {item.Shoe.Category.categoryName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Rs {item.Shoe.price}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      <p className="font-semibold text-primary">
                        Rs {(item.quantity * item.Shoe.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Subtotal</span>
                    <span>Rs {order.Order.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Shipping</span>
                    <span>Rs 100.00</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between items-center font-semibold">
                    <span>Total</span>
                    <span>Rs {(order.Order.totalPrice + 100).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold">
                    {order.Order.firstName} {order.Order.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.Order.phoneNumber}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="text-sm">
                    <p>{order.Order.addressLine}</p>
                    <p>{order.Order.city}, {order.Order.state}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Method</span>
                  <span className="capitalize">
                    {order.Order.Payment.paymentMethod === 'khalti' ? 'Khalti' :
                     order.Order.Payment.paymentMethod === 'esewa' ? 'Esewa' :
                     order.Order.Payment.paymentMethod === 'cod' ? 'Cash on Delivery' :
                     order.Order.Payment.paymentMethod}
                  </span>
              </div>
                <div className="flex justify-between items-center">
                  <span>Status</span>
                  {getPaymentStatusBadge(order.Order.Payment.paymentStatus)}
                </div>
              </CardContent>
            </Card>

            {/* Order Status Management */}
            <OrderStatusManager
              orderId={id as string}
              currentStatus={localOrderStatus || order.Order.status || 'pending'}
              paymentStatus={localPaymentStatus || order.Order.Payment.paymentStatus || 'unpaid'}
              onStatusChange={handleOrderStatusChange}
              onPaymentStatusChange={handlePaymentStatusChange}
              onRefresh={() => dispatch(fetchAdminOrderDetails(id as string))}
              isAdmin={true}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminOrderDetail;