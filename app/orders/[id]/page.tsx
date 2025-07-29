"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
} from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAdminOrderDetails, updateOrderStatus, updatePaymentStatus, OrderStatus, PaymentStatus } from "@/store/orderSlice";
import { socket } from "@/app/app";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminLayout from "@/app/adminLayout/adminLayout";

function AdminOrderDetail() {
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const { orderDetails, status } = useAppSelector((store) => store.orders);
  const [isUpdating, setIsUpdating] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Fetch order details when the page loads
  useEffect(() => {
    if (id && typeof id === 'string') {
      dispatch(fetchAdminOrderDetails(id));
    }
  }, [id, dispatch]);

  // Listen for order status updates from WebSocket
  useEffect(() => {
    // Check if socket is already connected and authenticated
    if (!socket.connected) {
      console.log('Order details: Socket not connected (WebSocket may be disabled)');
      return;
    }
    
    console.log('Order details: Socket connected, setting up listeners');

    const handleOrderStatusUpdate = (data: { orderId: string; status: string }) => {
      console.log('🔄 Received order status update from server:', data);
      console.log('📋 Current order ID:', id);
      if (data.orderId === id) {
        console.log('✅ Order ID matches, refreshing data...');
        dispatch(fetchAdminOrderDetails(id as string));
      } else {
        console.log('❌ Order ID mismatch, ignoring update');
      }
    };

    const handlePaymentStatusUpdate = (data: { orderId: string; paymentStatus: string }) => {
      console.log('💳 Received payment status update from server:', data);
      console.log('📋 Current order ID:', id);
      if (data.orderId === id) {
        console.log('✅ Order ID matches, refreshing data...');
        dispatch(fetchAdminOrderDetails(id as string));
      } else {
        console.log('❌ Order ID mismatch, ignoring update');
      }
    };

    const handleConnect = () => {
      console.log('WebSocket connected');
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log('WebSocket disconnected');
      setSocketConnected(false);
    };

    const handleError = (error: Error) => {
      console.error('WebSocket error:', error);
    };

    // Socket event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("error", handleError);
    socket.on("orderStatusUpdated", handleOrderStatusUpdate);
    socket.on("paymentStatusUpdated", handlePaymentStatusUpdate);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("error", handleError);
      socket.off("orderStatusUpdated", handleOrderStatusUpdate);
      socket.off("paymentStatusUpdated", handlePaymentStatusUpdate);
    };
  }, [id, dispatch, socket.connected]);

  const handleOrderStatusChange = async (value: string) => {
    if (id && typeof id === 'string' && orderDetails.length > 0) {
      setIsUpdating(true);
      try {
        const updateData = {
          status: value,
          orderId: id,
          userId: orderDetails[0].Order.userId,
        };
        console.log('🔄 Sending order status update to server:', updateData);
        console.log('📡 Socket connected:', socket.connected);
        console.log('🔌 Socket ID:', socket.id);
        
        // Check if socket is connected before trying to emit
        if (socket.connected) {
          socket.emit("updateOrderStatus", updateData);
          
          // Listen for server acknowledgment
          socket.once("orderStatusUpdateAcknowledged", (data: unknown) => {
            console.log('✅ Server acknowledged order status update:', data);
            // Refresh data after successful update
            dispatch(fetchAdminOrderDetails(id));
          });
          
          // Listen for server error
          socket.once("orderStatusUpdateError", (error: unknown) => {
            console.error('❌ Server error updating order status:', error);
            setIsUpdating(false);
          });
          
          // Reset loading state after a short delay
          setTimeout(() => setIsUpdating(false), 2000);
        } else {
          console.warn('⚠️ WebSocket not connected, updating order status via API instead');
          // Fallback: Update via API if WebSocket is not available
          const result = await dispatch(updateOrderStatus(id, value, orderDetails[0].Order.userId));
          if (result.success) {
            console.log('✅ Order status updated successfully via API');
          } else {
            console.error('❌ Failed to update order status via API:', result.error);
          }
          setIsUpdating(false);
        }
      } catch (error) {
        console.error('❌ Error updating order status:', error);
        setIsUpdating(false);
      }
    }
  };

  const handlePaymentStatusChange = async (value: string) => {
    if (id && typeof id === 'string' && orderDetails.length > 0) {
      setIsUpdating(true);
      try {
        // Debug the order details structure
        console.log('🔍 Order details structure:', orderDetails[0]);
        console.log('🔍 Payment object:', orderDetails[0].Order?.Payment);
        console.log('🔍 Order object:', orderDetails[0].Order);
        console.log('🔍 All available fields:', Object.keys(orderDetails[0]));
        console.log('🔍 Order object fields:', Object.keys(orderDetails[0].Order || {}));
        
        // Get payment ID from the Payment object
        const paymentId = orderDetails[0].Order?.Payment?.id;
        
        console.log('🔍 Using payment ID:', paymentId);
        
        if (!paymentId) {
          console.error('❌ Payment ID not found in order details');
          setIsUpdating(false);
          return;
        }
        
        const updateData = {
          status: value,
          orderId: id,
          paymentId: paymentId,
        };
        console.log('💳 Sending payment status update to server:', updateData);
        console.log('📡 Socket connected:', socket.connected);
        console.log('🔌 Socket ID:', socket.id);
        
        // Check if socket is connected before trying to emit
        if (socket.connected) {
          socket.emit("updatePaymentStatus", updateData);
          
          // Listen for server acknowledgment
          socket.once("paymentStatusUpdateAcknowledged", (data: unknown) => {
            console.log('✅ Server acknowledged payment status update:', data);
            // Refresh data after successful update
            dispatch(fetchAdminOrderDetails(id));
          });
          
          // Listen for server error
          socket.once("paymentStatusUpdateError", (error: unknown) => {
            console.error('❌ Server error updating payment status:', error);
            setIsUpdating(false);
          });
          
          // Reset loading state after a short delay
          setTimeout(() => setIsUpdating(false), 2000);
        } else {
          console.warn('⚠️ WebSocket not connected, updating payment status via API instead');
          // Fallback: Update via API if WebSocket is not available
          const result = await dispatch(updatePaymentStatus(id, paymentId, value));
          if (result.success) {
            console.log('✅ Payment status updated successfully via API');
          } else {
            console.error('❌ Failed to update payment status via API:', result.error);
          }
          setIsUpdating(false);
        }
      } catch (error) {
        console.error('❌ Error updating payment status:', error);
        setIsUpdating(false);
      }
    }
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
                variant={socketConnected ? "default" : "destructive"} 
                className="text-xs"
              >
                {socketConnected ? "Live" : "Offline"}
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
                      <p className="font-semibold">₹{item.Shoe.price}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      <p className="font-semibold text-primary">
                        ₹{(item.quantity * item.Shoe.price).toFixed(2)}
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
                    <span>₹{order.Order.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Shipping</span>
                    <span>₹100.00</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between items-center font-semibold">
                    <span>Total</span>
                    <span>₹{(order.Order.totalPrice + 100).toFixed(2)}</span>
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

            {/* Order Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Order Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Update Payment Status</label>
                  <Select
                    value={order.Order.Payment.paymentStatus}
                    onValueChange={handlePaymentStatusChange}
                    disabled={isUpdating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                  {isUpdating && (
                    <p className="text-xs text-muted-foreground">Updating...</p>
                  )}
                </div>
                {order.Order.status !== OrderStatus.Cancelled && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Update Order Status</label>
                    <Select
                      value={order.Order.status}
                      onValueChange={handleOrderStatusChange}
                      disabled={isUpdating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="preparation">Preparation</SelectItem>
                        <SelectItem value="ontheway">On the Way</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    {isUpdating && (
                      <p className="text-xs text-muted-foreground">Updating...</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminOrderDetail;