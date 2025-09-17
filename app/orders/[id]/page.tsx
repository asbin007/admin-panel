"use client";

import { useEffect, useState } from "react";
import NextImage from "next/image";
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
import { fetchAdminOrderDetails, updatePaymentStatus, updateOrderStatus } from "@/store/orderSlice";
import { toast } from "sonner";
import { isValidStatusTransition, type OrderStatus as ValidOrderStatus } from '@/utils/orderStatusValidation';
import { getWebSocketStatus } from "@/utils/websocketFallback";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/app/adminLayout/adminLayout";
import { PaymentStatus } from "@/globals/types/types";

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

  // Sync local state with order details - only update if different
  useEffect(() => {
    console.log('🔄 Order details updated:', {
      orderDetailsLength: orderDetails.length,
      hasOrderDetails: orderDetails.length > 0,
      orderStatus: orderDetails.length > 0 ? orderDetails[0]?.Order?.status : 'none',
      paymentStatus: orderDetails.length > 0 ? orderDetails[0]?.Order?.Payment?.paymentStatus : 'none',
      fullOrderStructure: orderDetails.length > 0 ? orderDetails[0] : null,
      orderKeys: orderDetails.length > 0 ? Object.keys(orderDetails[0]) : [],
      hasOrderProperty: orderDetails.length > 0 ? 'Order' in orderDetails[0] : false
    });
    
    if (orderDetails.length > 0) {
      const order = orderDetails[0];
      console.log('🔍 Order structure analysis:', {
        hasOrder: 'Order' in order,
        hasOrderProperty: order.Order ? Object.keys(order.Order) : 'no Order property',
        directStatus: (order as { status?: string }).status,
        directPaymentStatus: (order as { paymentStatus?: string }).paymentStatus,
        allKeys: Object.keys(order),
        orderStatusFromOrder: order.Order?.status,
        paymentStatusFromOrder: order.Order?.Payment?.paymentStatus,
        orderObject: order.Order
      });
      
      // DEBUG: Log the full order object to see the actual structure
      console.log('🔍 FULL ORDER OBJECT:', JSON.stringify(order, null, 2));
      
      // DEBUG: Check all possible status fields
      console.log('🔍 STATUS FIELD CHECK:', {
        'order.status': (order as unknown as Record<string, unknown>).status,
        'order.Order.status': order.Order?.status,
        'order.orderStatus': (order as unknown as Record<string, unknown>).orderStatus,
        'order.Order.orderStatus': (order.Order as unknown as Record<string, unknown>)?.orderStatus,
        'order.Order.order_status': (order.Order as unknown as Record<string, unknown>)?.order_status,
        'order.order_status': (order as unknown as Record<string, unknown>).order_status,
        'order.OrderStatus': (order as unknown as Record<string, unknown>).OrderStatus,
        'order.Order.OrderStatus': (order.Order as unknown as Record<string, unknown>)?.OrderStatus,
        'order.state': (order as unknown as Record<string, unknown>).state,
        'order.Order.state': order.Order?.state,
        'order.Order.orderState': (order.Order as unknown as Record<string, unknown>)?.orderState,
        'order.Order.order_state': (order.Order as unknown as Record<string, unknown>)?.order_state
      });
      
      // Try different possible paths for order status
      const serverOrderStatus = 
        order.Order?.status || 
        (order as unknown as Record<string, unknown>).status || 
        (order as unknown as Record<string, unknown>).orderStatus || 
        (order.Order as unknown as Record<string, unknown>)?.orderStatus ||
        (order.Order as unknown as Record<string, unknown>)?.order_status ||
        (order as unknown as Record<string, unknown>).order_status ||
        (order as unknown as Record<string, unknown>).OrderStatus ||
        (order.Order as unknown as Record<string, unknown>)?.OrderStatus ||
        (order as unknown as Record<string, unknown>).state ||
        (order.Order as unknown as Record<string, unknown>)?.state ||
        (order.Order as unknown as Record<string, unknown>)?.orderState ||
        (order.Order as unknown as Record<string, unknown>)?.order_state ||
        'pending';
        
      const serverPaymentStatus = 
        order.Order?.Payment?.paymentStatus || 
        (order as unknown as Record<string, unknown>).paymentStatus || 
        (order as unknown as Record<string, unknown>).payment_status ||
        (order.Order as unknown as Record<string, unknown>)?.paymentStatus ||
        (order.Order as unknown as Record<string, unknown>)?.payment_status ||
        'unpaid';
      
      // Only update local state if it's different from server state
      if (localOrderStatus !== serverOrderStatus) {
        setLocalOrderStatus(serverOrderStatus);
      }
      if (localPaymentStatus !== serverPaymentStatus) {
        setLocalPaymentStatus(serverPaymentStatus);
      }
    }
  }, [orderDetails, localOrderStatus, localPaymentStatus]);

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
        const orderData = data as { orderId?: string; status?: string };
        console.log('🔄 OrderDetail: Received orderId:', orderData.orderId, 'Current orderId:', id);
        if (orderData.orderId === id) {
          console.log('🔄 OrderDetail: Updating local state for order:', id);
          // Update local state immediately for instant UI feedback
          if (orderData.status) {
            console.log('🔄 OrderDetail: Setting local order status to:', orderData.status);
            setLocalOrderStatus(orderData.status);
          }
          // Only refresh if we need to sync with server data
          setTimeout(() => {
            dispatch(fetchAdminOrderDetails(id as string));
          }, 1000);
        }
      };

      const handlePaymentStatusUpdate = (data: unknown) => {
        console.log('💰 OrderDetail: Real-time payment status update received:', data);
        const paymentData = data as { orderId?: string; status?: string };
        console.log('💰 OrderDetail: Received orderId:', paymentData.orderId, 'Current orderId:', id);
        if (paymentData.orderId === id) {
          console.log('💰 OrderDetail: Updating local state for order:', id);
          // Update local state immediately for instant UI feedback
          if (paymentData.status) {
            console.log('💰 OrderDetail: Setting local payment status to:', paymentData.status);
            setLocalPaymentStatus(paymentData.status);
          }
          // Only refresh if we need to sync with server data
          setTimeout(() => {
            dispatch(fetchAdminOrderDetails(id as string));
          }, 1000);
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


  const handleOrderStatusChange = async (value: string): Promise<{ success: boolean; error?: string }> => {
    console.log('🚀 handleOrderStatusChange called with:', {
      value,
      id,
      orderDetailsLength: orderDetails.length,
      hasOrderDetails: orderDetails.length > 0
    });
    
    if (id && typeof id === 'string' && orderDetails.length > 0) {
      try {
        console.log('✅ Starting status update process');
        setIsUpdating(true);
        
        console.log('🔍 Order details check:', {
          orderDetails: orderDetails[0],
          orderStatus: orderDetails[0]?.Order?.status,
          paymentStatus: orderDetails[0]?.Order?.Payment?.paymentStatus,
          orderStructure: {
            hasOrder: !!orderDetails[0],
            hasOrderOrder: !!orderDetails[0]?.Order,
            orderKeys: orderDetails[0] ? Object.keys(orderDetails[0]) : [],
            orderOrderKeys: orderDetails[0]?.Order ? Object.keys(orderDetails[0].Order) : []
          }
        });
        // Get current order and payment status for validation
        const currentOrder = orderDetails[0];
        
        // Try different possible paths for order data
        const currentPaymentStatus = 
          currentOrder?.Order?.Payment?.paymentStatus || 
          (currentOrder as unknown as Record<string, unknown>).paymentStatus || 
          (currentOrder as unknown as Record<string, unknown>).payment_status ||
          (currentOrder.Order as unknown as Record<string, unknown>)?.paymentStatus ||
          (currentOrder.Order as unknown as Record<string, unknown>)?.payment_status ||
          'unpaid';
          
        const paymentMethod = 
          currentOrder?.Order?.Payment?.paymentMethod || 
          (currentOrder as unknown as Record<string, unknown>).paymentMethod || 
          (currentOrder as unknown as Record<string, unknown>).payment_method ||
          (currentOrder.Order as unknown as Record<string, unknown>)?.paymentMethod ||
          (currentOrder.Order as unknown as Record<string, unknown>)?.payment_method ||
          'cod';
        
        // Get current order status with fallback - try all possible paths
        const currentOrderStatus = 
          currentOrder?.Order?.status || 
          (currentOrder as unknown as Record<string, unknown>).status || 
          (currentOrder as unknown as Record<string, unknown>).orderStatus || 
          (currentOrder.Order as unknown as Record<string, unknown>)?.orderStatus ||
          (currentOrder.Order as unknown as Record<string, unknown>)?.order_status ||
          (currentOrder as unknown as Record<string, unknown>).order_status ||
          (currentOrder as unknown as Record<string, unknown>).OrderStatus ||
          (currentOrder.Order as unknown as Record<string, unknown>)?.OrderStatus ||
          (currentOrder as unknown as Record<string, unknown>).state ||
          (currentOrder.Order as unknown as Record<string, unknown>)?.state ||
          (currentOrder.Order as unknown as Record<string, unknown>)?.orderState ||
          (currentOrder.Order as unknown as Record<string, unknown>)?.order_state ||
          localOrderStatus || 
          'pending';
        
        console.log('🔍 Status change data paths:', {
          orderStatusFromOrder: currentOrder?.Order?.status,
          orderStatusDirect: (currentOrder as { status?: string })?.status,
          localOrderStatus: localOrderStatus,
          finalOrderStatus: currentOrderStatus,
          paymentStatusFromOrder: currentOrder?.Order?.Payment?.paymentStatus,
          paymentStatusDirect: (currentOrder as { paymentStatus?: string })?.paymentStatus,
          finalPaymentStatus: currentPaymentStatus
        });
        
        console.log('🔍 Status validation:', {
          currentOrderStatus,
          localOrderStatus,
          targetStatus: value,
          paymentStatus: currentPaymentStatus,
          paymentMethod
        });
        
        // Client-side validation for status transitions using centralized utility
        if (!isValidStatusTransition(currentOrderStatus as ValidOrderStatus, value as ValidOrderStatus)) {
          toast.error('Invalid status transition.', {
            description: `Cannot change status from ${currentOrderStatus} to ${value}`,
            duration: 5000,
          });
          setIsUpdating(false);
          return { success: false, error: `Invalid status transition from ${currentOrderStatus} to ${value}` };
        }
        
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
        console.log('📋 Current order status:', currentOrderStatus);
        console.log('🆔 Order ID:', id);
        
        // Use the updated order status function with better error handling
        console.log('🔄 Dispatching updateOrderStatus with:', {
          orderId: id,
          status: value,
          adminUserId
        });
        
        console.log('🚀 Calling updateOrderStatus API...');
        console.log('🚀 Current status:', localOrderStatus);
        console.log('🚀 New status:', value);
        
        // Call the actual updateOrderStatus function from Redux slice
        const result = await dispatch(updateOrderStatus(id, value, adminUserId)) as { success: boolean; error?: string; method?: string };
        
        console.log('📊 Status update result:', result);
        
        if (result.success) {
          console.log(`✅ Order status updated successfully via ${result.method || 'API'}`);
          // Update local state immediately for instant UI feedback
          setLocalOrderStatus(value);
          setIsUpdating(false);
          
          // Refresh order details
          dispatch(fetchAdminOrderDetails(id));
          
          // Show success toast
          toast.success('Order status updated successfully!', {
            description: `Status changed to ${value}`,
            duration: 3000,
          });
          
          return { success: true };
        } else {
          // Check if it's a WebSocket timeout (should be handled silently)
          if (result.error === 'WebSocket timeout') {
            console.log('⏰ WebSocket timeout, update will be processed via API fallback');
            // Update local state for immediate feedback
            setLocalOrderStatus(value);
            setIsUpdating(false);
            return { success: true }; // Treat timeout as success since API will handle it
          }
          
          // Handle other error scenarios
          const errorMessage = result.error || 'Unknown error occurred';
          console.error('❌ Failed to update order status:', errorMessage);
          
          // Check if user is not online but update will be saved
          if (result.error?.includes('User not online')) {
            toast.success('Order status updated successfully!', {
              description: 'User was offline, but update was saved',
              duration: 3000,
            });
            // Update local state immediately
            setLocalOrderStatus(value);
            setIsUpdating(false);
            return { success: true };
          }
          
          // Show error for other cases
          toast.error('Failed to update order status', {
            description: errorMessage,
            duration: 4000,
          });
          setIsUpdating(false);
          return { success: false, error: errorMessage };
        }
      } catch (error) {
        console.error('❌ Error updating order status:', error);
        setIsUpdating(false);
        return { success: false, error: 'Failed to update order status. Please try again.' };
      }
    }
    console.error('❌ Cannot update status: missing required data', {
      id,
      idType: typeof id,
      orderDetailsLength: orderDetails.length,
      hasOrderDetails: orderDetails.length > 0
    });
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

        // Khalti payment validation
        if (currentOrder?.Order?.Payment?.paymentMethod === 'khalti' && currentPaymentStatus === 'paid' && value === 'unpaid') {
          toast.error('Cannot change Khalti payment status from paid to unpaid.', {
            description: `Khalti payments are automatically verified and cannot be manually reversed`,
            duration: 6000,
          });
          setIsUpdating(false);
          return { success: false, error: 'Khalti payments cannot be manually reversed' };
        }

        // COD payment validation
        if (currentOrder?.Order?.Payment?.paymentMethod === 'cod' && value === 'paid' && currentOrderStatus === 'pending') {
          toast.error('COD payments should only be marked as paid when order is delivered or confirmed.', {
            description: `Please update order status to 'delivered' or 'preparation' first`,
            duration: 6000,
          });
          setIsUpdating(false);
          return { success: false, error: 'Update order status before marking COD as paid' };
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
        const result = await dispatch(updatePaymentStatus(id, paymentId, value as PaymentStatus, adminUserId)) as { success: boolean; error?: string; method?: string; details?: any };
        
        if (result.success) {
          console.log(`✅ Payment status updated successfully via ${result.method || 'API'}`);
          // Update local state immediately for instant UI feedback
          setLocalPaymentStatus(value);
          setIsUpdating(false);
          return { success: true };
        } else if (result.error && result.error !== 'WebSocket timeout') {
          // Only show error if it's not a WebSocket timeout
          console.error('❌ Failed to update payment status:', result.error);
          console.error('❌ Error details:', result.details);
          setIsUpdating(false);
          
          // Show specific error message to user
          const errorMessage = result.details?.message || result.error || 'Unknown error';
          return { success: false, error: errorMessage };
        } else {
          console.error('❌ Failed to update payment status:', result.error);
          // Show more specific error message
          if (result.error?.includes('User not online')) {
            toast.success('Payment status updated successfully!', {
              description: 'User was offline, but update was saved',
              duration: 3000,
            });
            // Update local state immediately
            setLocalPaymentStatus(value);
          } else {
            toast.error('Failed to update payment status', {
              description: result.error || 'Please try again',
              duration: 4000,
            });
          }
          setIsUpdating(false);
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
              {getStatusBadge(String(localOrderStatus || order.Order?.status || (order as unknown as Record<string, unknown>).status || (order as unknown as Record<string, unknown>).orderStatus || 'pending'))}
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
                      <NextImage
                        src={item.Shoe?.images?.[0]
                          ? `https://res.cloudinary.com/dxpe7jikz/image/upload/v1750340657${
                              item.Shoe.images[0].startsWith("/uploads")
                                ? item.Shoe.images[0].replace("/uploads", "")
                                : item.Shoe.images[0]
                            }.jpg`
                          : '/placeholder-image.svg'
                        }
                        alt={item.Shoe?.name || 'Product'}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-image.svg';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.Shoe?.name || 'Unknown Product'}</h3>
                      <p className="text-sm text-muted-foreground">
                        Category: {item.Shoe?.Category?.categoryName || 'Unknown Category'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Rs {item.Shoe?.price || 0}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      <p className="font-semibold text-primary">
                        Rs {((item.quantity || 0) * (item.Shoe?.price || 0)).toFixed(2)}
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
                    <span>Rs {(order.Order.totalPrice - 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Shipping</span>
                    <span>Rs 100.00</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between items-center font-semibold">
                    <span>Total</span>
                    <span>Rs {order.Order.totalPrice.toFixed(2)}</span>
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
                  {getPaymentStatusBadge(localPaymentStatus || order.Order.Payment.paymentStatus)}
                </div>
              </CardContent>
            </Card>

            {/* Order Status Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Status Display */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      (localOrderStatus || order.Order.status) === 'pending' ? 'bg-gray-400' :
                      (localOrderStatus || order.Order.status) === 'preparation' ? 'bg-blue-500' :
                      (localOrderStatus || order.Order.status) === 'ontheway' ? 'bg-yellow-500' :
                      (localOrderStatus || order.Order.status) === 'delivered' ? 'bg-green-500' :
                      'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Current Status</p>
                      <p className="text-lg font-semibold capitalize">{String(localOrderStatus || order.Order?.status || (order as unknown as Record<string, unknown>).status || (order as unknown as Record<string, unknown>).orderStatus || 'pending')}</p>
                    </div>
                  </div>
                  {isUpdating && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                </div>

                {/* Status Timeline */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700">Order Progress</h4>
                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    
                    {[
                      { value: 'pending', label: 'Order Placed', icon: Clock, color: 'bg-gray-500' },
                      { value: 'preparation', label: 'Preparing', icon: Package, color: 'bg-blue-500' },
                      { value: 'ontheway', label: 'Shipped', icon: Truck, color: 'bg-yellow-500' },
                      { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'bg-green-500' }
                    ].map((step) => {
                      const Icon = step.icon;
                      const currentStatus = localOrderStatus || order.Order.status;
                      const isCompleted = getStatusProgress(currentStatus) > getStatusProgress(step.value);
                      const isCurrent = currentStatus === step.value;
                      const isClickable = !isUpdating && !isCurrent && currentStatus !== 'cancelled';
                      
                      return (
                        <div key={step.value} className="relative flex items-center gap-4 pb-6 last:pb-0">
                          {/* Timeline Dot */}
                          <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                            isCurrent ? `${step.color} border-white shadow-lg` :
                            isCompleted ? 'bg-green-500 border-white' :
                            isClickable ? 'bg-white border-gray-300 hover:border-blue-400 cursor-pointer' :
                            'bg-white border-gray-200'
                          }`}
                          onClick={() => {
                            console.log('🖱️ Status dot clicked:', {
                              stepValue: step.value,
                              isClickable,
                              isUpdating,
                              isCurrent,
                              currentStatus: localOrderStatus || order.Order.status
                            });
                            
                            if (isClickable) {
                              const currentPaymentStatus = order.Order.Payment.paymentStatus;
                              const paymentMethod = order.Order.Payment.paymentMethod;
                              
                              console.log('💳 Payment details:', {
                                currentPaymentStatus,
                                paymentMethod,
                                stepValue: step.value
                              });
                              
                              if (step.value === 'delivered' && currentPaymentStatus !== 'paid') {
                                console.log('❌ Payment check failed for delivered status');
                                toast.error('Cannot deliver order without payment. Payment must be completed first.');
                                return;
                              }
                              
                              if (step.value === 'preparation' && 
                                  paymentMethod !== 'cod' && 
                                  currentPaymentStatus !== 'paid') {
                                console.log('❌ Payment check failed for preparation status');
                                toast.error('Cannot prepare order without payment for non-COD orders.');
                                return;
                              }
                              
                              console.log('✅ All checks passed, calling handleOrderStatusChange');
                              handleOrderStatusChange(step.value);
                            } else {
                              console.log('❌ Status dot not clickable:', {
                                isUpdating,
                                isCurrent,
                                currentStatus: localOrderStatus || order.Order.status
                              });
                            }
                          }}>
                            {isCurrent ? <Icon className="w-4 h-4 text-white" /> : 
                             isCompleted ? <CheckCircle className="w-4 h-4 text-white" /> :
                             <Icon className="w-4 h-4 text-gray-400" />}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1">
                            <p className={`font-medium ${
                              isCurrent ? 'text-blue-600' : 
                              isCompleted ? 'text-green-600' :
                              isClickable ? 'text-gray-700 hover:text-gray-900 cursor-pointer' :
                              'text-gray-400'
                            }`}>
                              {step.label}
                            </p>
                            {isCurrent && (
                              <p className="text-xs text-blue-500 mt-1">In Progress</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Status Actions */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'preparation', label: 'Start Prep', icon: Package, color: 'bg-blue-500' },
                    { value: 'ontheway', label: 'Ship Order', icon: Truck, color: 'bg-yellow-500' },
                    { value: 'delivered', label: 'Mark Delivered', icon: CheckCircle, color: 'bg-green-500' },
                    { value: 'cancelled', label: 'Cancel Order', icon: XCircle, color: 'bg-red-500' }
                  ].map((action) => {
                    const Icon = action.icon;
                    const isCurrentStatus = (localOrderStatus || order.Order.status) === action.value;
                    const isDisabled = isUpdating || isCurrentStatus;
                    
                    return (
                      <Button
                        key={action.value}
                        variant={isCurrentStatus ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleOrderStatusChange(action.value)}
                        disabled={isDisabled}
                        className={`flex items-center gap-2 ${
                          isCurrentStatus ? `${action.color} text-white` : ''
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Payment Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Payment Status */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      (localPaymentStatus || order.Order.Payment.paymentStatus) === 'paid' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Payment Status</p>
                      <p className="text-lg font-semibold capitalize">
                        {localPaymentStatus || order.Order.Payment.paymentStatus}
                      </p>
                    </div>
                  </div>
                  {getPaymentStatusBadge(localPaymentStatus || order.Order.Payment.paymentStatus)}
                </div>

                {/* Payment Method Info */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium capitalize">
                    {order.Order.Payment.paymentMethod === 'khalti' ? 'Khalti' :
                     order.Order.Payment.paymentMethod === 'esewa' ? 'Esewa' :
                     order.Order.Payment.paymentMethod === 'cod' ? 'Cash on Delivery' :
                     order.Order.Payment.paymentMethod}
                  </p>
                </div>

                {/* Payment Actions */}
                <div className="flex gap-2">
                  <Button
                    variant={order.Order.Payment.paymentStatus === 'paid' ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => handlePaymentStatusChange('paid')}
                    disabled={isUpdating || order.Order.Payment.paymentStatus === 'paid' || 
                             (order.Order.Payment.paymentMethod === 'cod' && order.Order.status === 'pending')}
                    className="flex items-center gap-2 flex-1"
                    title={order.Order.Payment.paymentMethod === 'cod' && order.Order.status === 'pending' ? 
                           'COD payments should only be marked as paid when order is delivered or confirmed' : 
                           'Mark payment as paid'}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Paid
                  </Button>
                  <Button
                    variant={order.Order.Payment.paymentStatus === 'unpaid' ? 'outline' : 'destructive'}
                    size="sm"
                    onClick={() => {
                      const currentOrderStatus = order.Order.status;
                      if (currentOrderStatus === 'delivered' || currentOrderStatus === 'ontheway') {
                        toast.error(`Cannot change payment status to unpaid for ${currentOrderStatus} orders.`);
                        return;
                      }
                      if (order.Order.Payment.paymentMethod === 'khalti' && order.Order.Payment.paymentStatus === 'paid') {
                        toast.error('Cannot change Khalti payment status from paid to unpaid. Khalti payments are automatically verified.');
                        return;
                      }
                      handlePaymentStatusChange('unpaid');
                    }}
                    disabled={isUpdating || order.Order.Payment.paymentStatus === 'unpaid' || 
                             order.Order.status === 'delivered' || order.Order.status === 'ontheway' ||
                             (order.Order.Payment.paymentMethod === 'khalti' && order.Order.Payment.paymentStatus === 'paid')}
                    className="flex items-center gap-2 flex-1"
                    title={order.Order.Payment.paymentMethod === 'khalti' && order.Order.Payment.paymentStatus === 'paid' ? 
                           'Khalti payments cannot be manually reversed' : 
                           'Mark payment as unpaid'}
                  >
                    <XCircle className="w-4 h-4" />
                    Mark as Unpaid
                  </Button>
                </div>

                {isUpdating && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating payment status...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Rules Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Business Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Status Change Rules:</h4>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Delivered orders can be changed to Preparation, On the way, or Cancelled</li>
                      <li>• Cancelled orders cannot be changed to any other status</li>
                      <li>• Non-COD orders need payment before preparation</li>
                      <li>• Delivered orders need payment before delivery</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Payment Rules:</h4>
                    <ul className="space-y-1 text-green-700">
                      <li>• Khalti payments cannot be reversed manually</li>
                      <li>• COD payments marked paid only when delivered/confirmed</li>
                      <li>• Delivered/On-the-way orders payment status cannot be changed</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">Admin Guidelines:</h4>
                    <ul className="space-y-1 text-yellow-700">
                      <li>• Always verify payment before status change</li>
                      <li>• Customer gets real-time notifications</li>
                      <li>• All changes are logged with admin ID</li>
                      <li>• Contact customer for any disputes</li>
                    </ul>
                  </div>
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