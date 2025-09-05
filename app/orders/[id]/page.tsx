"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAdminOrderDetails, updateOrderStatus, updatePaymentStatus, fetchOrders } from "@/store/orderSlice";
import { toast } from "sonner";
import { getWebSocketStatus } from "@/utils/websocketFallback";
import { socket } from "@/app/app";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/app/adminLayout/adminLayout";
import OrderStatusManager from "@/components/OrderStatusManager";
import { OrderStatus, PaymentStatus } from "@/globals/types/types";

function AdminOrderDetail() {
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const { orderDetails, status } = useAppSelector((store) => store.orders);
  const [localOrderStatus, setLocalOrderStatus] = useState<string>('');
  const [localPaymentStatus, setLocalPaymentStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

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

  // WebSocket real-time updates
  useEffect(() => {
    if (socket && socket.connected) {
      // Listen for order status updates
      const handleOrderStatusUpdate = (data: { orderId: string }) => {
        if (data.orderId === id) {
          dispatch(fetchAdminOrderDetails(id as string));
        }
      };

      // Listen for payment status updates
      const handlePaymentStatusUpdate = (data: { orderId: string }) => {
        if (data.orderId === id) {
          dispatch(fetchAdminOrderDetails(id as string));
        }
      };

      // Listen for broadcast updates
      const handleBroadcastUpdate = (data: { orderId: string }) => {
        if (data.orderId === id) {
          dispatch(fetchAdminOrderDetails(id as string));
        }
      };

      // Add event listeners
      socket.on('statusUpdated', handleOrderStatusUpdate);
      socket.on('paymentStatusUpdated', handlePaymentStatusUpdate);
      socket.on('broadcastOrderUpdate', handleBroadcastUpdate);
      socket.on('broadcastPaymentUpdate', handleBroadcastUpdate);

      // Cleanup listeners on unmount
      return () => {
        socket.off('statusUpdated', handleOrderStatusUpdate);
        socket.off('paymentStatusUpdated', handlePaymentStatusUpdate);
        socket.off('broadcastOrderUpdate', handleBroadcastUpdate);
        socket.off('broadcastPaymentUpdate', handleBroadcastUpdate);
      };
    }
  }, [id, dispatch]);


  const handleOrderStatusChange = async (value: string): Promise<{ success: boolean; error?: string }> => {
    if (id && typeof id === 'string' && orderDetails.length > 0) {
      try {
        setIsUpdating(true);
        // Get current order and payment status for validation
        const currentOrder = orderDetails[0];
        const currentPaymentStatus = currentOrder?.Order?.Payment?.paymentStatus;
        const paymentMethod = currentOrder?.Order?.Payment?.paymentMethod;
        
        // Client-side validation
        if (value === 'delivered' && currentPaymentStatus !== 'paid') {
          toast.error('Cannot deliver order without payment. Payment must be completed first.', {
            description: `Current payment status: ${currentPaymentStatus}`,
            duration: 5000,
          });
          setIsUpdating(false);
          return { success: false, error: 'Payment required for delivery' };
        }
        
        if (value === 'preparation' && 
            paymentMethod !== 'cod' && 
            currentPaymentStatus !== 'paid') {
          toast.error('Cannot prepare order without payment for non-COD orders.', {
            description: `Payment method: ${paymentMethod}, Status: ${currentPaymentStatus}`,
            duration: 5000,
          });
          setIsUpdating(false);
          return { success: false, error: 'Payment required for preparation' };
        }
        
        // Get admin user ID from localStorage
        const userDataString = localStorage.getItem('userData');
        const userData = userDataString ? JSON.parse(userDataString) : null;
        const adminUserId = userData?.id || userData?.email; // Use email as fallback
        
        console.log('🔄 Updating order status to:', value);
        console.log('👤 Admin User ID:', adminUserId);
        console.log('💰 Current payment status:', currentPaymentStatus);
        console.log('💳 Payment method:', paymentMethod);
        
        // Use the updated order status function with better error handling
        const result = await dispatch(updateOrderStatus(id, value as OrderStatus, adminUserId)) as { success: boolean; error?: string; method?: string };
        
        if (result.success) {
          console.log(`✅ Order status updated successfully via ${result.method || 'API'}`);
          // Update local state immediately
          setLocalOrderStatus(value);
          // Refresh order details to get latest data
          dispatch(fetchAdminOrderDetails(id));
          setIsUpdating(false);
          return { success: true };
        } else if (result.error && result.error !== 'WebSocket timeout') {
          // Only show error if it's not a WebSocket timeout
          console.error('❌ Failed to update order status:', result.error);
          setIsUpdating(false);
          return { success: false, error: result.error || 'Unknown error' };
        } else {
          console.error('❌ Failed to update order status:', result.error);
          // Show more specific error message
          if (result.error?.includes('User not online')) {
            toast.success('Order status updated successfully!', {
              description: 'User was offline, but update was saved',
              duration: 3000,
            });
            // Still refresh the data
            dispatch(fetchAdminOrderDetails(id));
            dispatch(fetchOrders());
          } else {
            toast.error('Failed to update order status', {
              description: result.error || 'Please try again',
              duration: 4000,
            });
          }
        }
        
        setIsUpdating(false);
        return { success: true }; // WebSocket timeout is handled silently
      } catch (error) {
        console.error('❌ Error updating order status:', error);
        setIsUpdating(false);
        return { success: false, error: 'Failed to update order status. Please try again.' };
      }
    }
    return { success: false, error: 'Invalid order ID or no order details' };
  };

  const handlePaymentStatusChange = async (value: string): Promise<{ success: boolean; error?: string }> => {
    if (id && typeof id === 'string' && orderDetails.length > 0) {
      try {
        setIsUpdating(true);
        const paymentId = orderDetails[0].Order?.Payment?.id;
        const currentOrder = orderDetails[0];
        const currentPaymentStatus = currentOrder?.Order?.Payment?.paymentStatus;
        const currentOrderStatus = currentOrder?.Order?.status;
        
        if (!paymentId) {
          console.error('❌ Payment ID not found in order details');
          return { success: false, error: 'Payment ID not found in order details' };
        }
        
        // Client-side validation for payment status
        if (currentPaymentStatus === 'paid' && value === 'unpaid' && currentOrderStatus === 'delivered') {
          toast.error('Cannot change payment status from paid to unpaid for delivered orders.', {
            description: `Order is already delivered`,
            duration: 5000,
          });
          setIsUpdating(false);
          return { success: false, error: 'Cannot change payment status for delivered orders' };
        }
        
        if (currentPaymentStatus === 'paid' && value === 'unpaid' && currentOrderStatus === 'ontheway') {
          toast.error('Cannot change payment status from paid to unpaid for orders that are on the way.', {
            description: `Order is currently on the way`,
            duration: 5000,
          });
          setIsUpdating(false);
          return { success: false, error: 'Cannot change payment status for orders on the way' };
        }
        
        // Get admin user ID from localStorage
        const userDataString = localStorage.getItem('userData');
        const userData = userDataString ? JSON.parse(userDataString) : null;
        const adminUserId = userData?.id || userData?.email; // Use email as fallback
        
        console.log('🔄 Updating payment status to:', value);
        console.log('💰 Payment ID:', paymentId);
        console.log('👤 Admin User ID:', adminUserId);
        console.log('📦 Current order status:', currentOrderStatus);
        console.log('💳 Current payment status:', currentPaymentStatus);
        
        // Use the updated payment status function with better error handling
        const result = await dispatch(updatePaymentStatus(id, paymentId, value as PaymentStatus, adminUserId)) as { success: boolean; error?: string; method?: string };
        
        if (result.success) {
          console.log(`✅ Payment status updated successfully via ${result.method || 'API'}`);
          // Update local state immediately
          setLocalPaymentStatus(value);
          // Refresh order details to get latest data
          dispatch(fetchAdminOrderDetails(id));
          setIsUpdating(false);
          return { success: true };
        } else if (result.error && result.error !== 'WebSocket timeout') {
          // Only show error if it's not a WebSocket timeout
          console.error('❌ Failed to update payment status:', result.error);
          return { success: false, error: result.error || 'Unknown error' };
        } else {
          console.error('❌ Failed to update payment status:', result.error);
          // Show more specific error message
          if (result.error?.includes('User not online')) {
            toast.success('Payment status updated successfully!', {
              description: 'User was offline, but update was saved',
              duration: 3000,
            });
            // Still refresh the data
            dispatch(fetchAdminOrderDetails(id));
          } else {
            toast.error('Failed to update payment status', {
              description: result.error || 'Please try again',
              duration: 4000,
            });
          }
        }
        
        setIsUpdating(false);
        return { success: true }; // WebSocket timeout is handled silently
      } catch (error) {
        console.error('❌ Error updating payment status:', error);
        setIsUpdating(false);
        return { success: false, error: 'Failed to update payment status. Please try again.' };
      }
    }
    return { success: false, error: 'Invalid order ID or no order details' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'preparation':
        return <Badge className="bg-blue-500">Preparation</Badge>;
      case 'ontheway':
        return <Badge className="bg-yellow-500">On the way</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'preparation':
        return 25;
      case 'ontheway':
        return 50;
      case 'delivered':
        return 75;
      case 'cancelled':
        return 0;
      default:
        return 0;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'unpaid':
      default:
        return <Badge variant="destructive">Unpaid</Badge>;
    }
  };

  // Loading state
  if (status === "loading") {
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

  // No order details
  if (!orderDetails.length) {
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
                <p className="text-muted-foreground">No order details found</p>
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
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <OrderStatusManager
                  orderId={id as string}
                  currentStatus={localOrderStatus || order.Order.status || 'pending'}
                  paymentStatus={localPaymentStatus || order.Order.Payment.paymentStatus || 'unpaid'}
                  onStatusChange={handleOrderStatusChange}
                  onPaymentStatusChange={handlePaymentStatusChange}
                  onRefresh={() => dispatch(fetchAdminOrderDetails(id as string))}
                  isAdmin={true}
                />
                        
                <Button
                  variant={order.Order.Payment.paymentStatus === 'unpaid' ? 'outline' : 'destructive'}
                  size="sm"
                  onClick={() => {
                    // Check if changing to unpaid is allowed
                    const currentOrderStatus = order.Order.status;
                    if (currentOrderStatus === 'delivered' || currentOrderStatus === 'ontheway') {
                      toast.error(`Cannot change payment status to unpaid for ${currentOrderStatus} orders.`);
                      return;
                    }
                    handlePaymentStatusChange('unpaid');
                  }}
                  disabled={isUpdating || order.Order.Payment.paymentStatus === 'unpaid' || 
                           order.Order.status === 'delivered' || order.Order.status === 'ontheway'}
                  className="flex items-center gap-2"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Mark as Unpaid
                </Button>
                
                {isUpdating && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating payment status...
                  </div>
                )}
                
                <div className="space-y-4">
                  <label className="text-sm font-medium">Order Status Management</label>
                  
                  {/* Status Progress Bar */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Order Progress</span>
                      <span className="font-medium capitalize">{order.Order.status}</span>
                      {isUpdating && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      )}
                    </div>
                    
                    {/* Progress Steps with Checkpoints */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        {[
                          { value: 'pending', label: 'Pending', icon: Clock, position: 0 },
                          { value: 'preparation', label: 'Preparation', icon: Package, position: 25 },
                          { value: 'ontheway', label: 'On the Way', icon: Truck, position: 50 },
                          { value: 'delivered', label: 'Delivered', icon: CheckCircle, position: 75 }
                        ].map((step) => {
                          const Icon = step.icon;
                          const isCompleted = getStatusProgress(order.Order.status) >= step.position;
                          const isCurrent = order.Order.status === step.value;
                          const isCancelled = order.Order.status === 'cancelled';
                          const isClickable = !isUpdating && !isCancelled;
                          
                          return (
                            <div 
                              key={step.value} 
                              className={`flex flex-col items-center space-y-1 ${
                                isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                              } transition-all duration-200`}
                              onClick={() => {
                                if (isClickable && order.Order.status !== step.value) {
                                  // Additional validation for realistic ecommerce flow
                                  const currentPaymentStatus = order.Order.Payment.paymentStatus;
                                  const paymentMethod = order.Order.Payment.paymentMethod;
                                  
                                  // Check if status change is allowed
                                  if (step.value === 'delivered' && currentPaymentStatus !== 'paid') {
                                    toast.error('Cannot deliver order without payment. Payment must be completed first.');
                                    return;
                                  }
                                  
                                  if (step.value === 'preparation' && 
                                      paymentMethod !== 'cod' && 
                                      currentPaymentStatus !== 'paid') {
                                    toast.error('Cannot prepare order without payment for non-COD orders.');
                                    return;
                                  }
                                  
                                  handleOrderStatusChange(step.value);
                                }
                              }}
                            >
                              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all duration-300 ${
                                isCancelled ? 'bg-red-500 text-white' :
                                isCurrent ? 'bg-blue-500 text-white scale-110' :
                                isCompleted ? 'bg-green-500 text-white' :
                                isClickable ? 'bg-gray-300 text-gray-600 hover:bg-gray-400' :
                                'bg-gray-200 text-gray-400'
                              }`}>
                                {isCancelled ? <XCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                              </div>
                              <span className={`text-xs font-medium ${
                                isCurrent ? 'text-blue-600' : 
                                isCompleted ? 'text-green-600' :
                                isCancelled ? 'text-red-600' :
                                isClickable ? 'text-gray-600 hover:text-gray-800' :
                                'text-gray-400'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Progress Line with Checkpoints */}
                      <div className="relative">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                          <div className={`h-2 rounded-full transition-all duration-700 ease-out shadow-sm ${
                            order.Order.status === 'cancelled' ? 'w-full bg-red-500' :
                            order.Order.status === 'pending' ? 'w-0 bg-blue-500' :
                            order.Order.status === 'preparation' ? 'w-1/4 bg-blue-500' :
                            order.Order.status === 'ontheway' ? 'w-1/2 bg-yellow-500' :
                            order.Order.status === 'delivered' ? 'w-3/4 bg-green-500' :
                            'w-0'
                          }`} />
                        </div>
                        
                        {/* Checkpoint Dots */}
                        <div className="absolute top-0 left-0 w-full h-2 flex justify-between items-center">
                          {[
                            { position: 0, status: 'pending' },
                            { position: 25, status: 'preparation' },
                            { position: 50, status: 'ontheway' },
                            { position: 75, status: 'delivered' }
                          ].map((checkpoint) => {
                            const isCompleted = getStatusProgress(order.Order.status) >= checkpoint.position;
                            const isCancelled = order.Order.status === 'cancelled';
                            const isClickable = !isUpdating && !isCancelled && checkpoint.status !== order.Order.status;
                            
                            return (
                              <div
                                key={checkpoint.status}
                                className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                                  isCancelled ? 'bg-red-500 border-red-500' :
                                  isCompleted ? 'bg-green-500 border-green-500' :
                                  isClickable ? 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-100 cursor-pointer' :
                                  'bg-white border-gray-300'
                                }`}
                                style={{ transform: 'translateY(-6px)' }}
                                onClick={() => {
                                  if (isClickable && checkpoint.status !== order.Order.status) {
                                    handleOrderStatusChange(checkpoint.status);
                                  }
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* All Status Options */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Change Status To:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-gray-500' },
                        { value: 'preparation', label: 'Preparation', icon: Package, color: 'bg-blue-500' },
                        { value: 'ontheway', label: 'On the Way', icon: Truck, color: 'bg-yellow-500' },
                        { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'bg-green-500' },
                        { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-500' }
                      ].map((status) => {
                        const Icon = status.icon;
                        const isCurrentStatus = order.Order.status === status.value;
                        const isDisabled = isUpdating || isCurrentStatus;
                        
                        return (
                          <Button
                            key={status.value}
                            variant={isCurrentStatus ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleOrderStatusChange(status.value)}
                            disabled={isDisabled}
                            className={`flex items-center justify-between w-full ${
                              isCurrentStatus ? `${status.color} text-white` : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Icon className="w-4 h-4" />
                              )}
                              <span>{status.label}</span>
                            </div>
                            {isCurrentStatus && (
                              <Badge variant="secondary" className="text-xs">
                                Current
                              </Badge>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {isUpdating && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating order status...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminOrderDetail;