"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminLayout from "../adminLayout/adminLayout";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useEffect } from "react";
import { fetchOrders } from "@/store/orderSlice";
import { socket } from "@/app/app";
import Link from "next/link";

// Enums
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

export default function Orders() {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((store) => store.orders);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  // Listen for order status updates from WebSocket
  useEffect(() => {
    // Check if socket is already connected and authenticated
    if (!socket.connected) {
      console.log('Orders page: Socket not connected (WebSocket may be disabled)');
      return;
    }
    
    console.log('Orders page: Socket connected, setting up listeners');

    const handleOrderStatusUpdate = () => {
      // Refresh orders list when status is updated
      dispatch(fetchOrders());
    };

    const handlePaymentStatusUpdate = () => {
      // Refresh orders list when payment status is updated
      dispatch(fetchOrders());
    };

    // Listen for WebSocket events
    socket.on("orderStatusUpdated", handleOrderStatusUpdate);
    socket.on("paymentStatusUpdated", handlePaymentStatusUpdate);

    // Cleanup listeners
    return () => {
      socket.off("orderStatusUpdated", handleOrderStatusUpdate);
      socket.off("paymentStatusUpdated", handlePaymentStatusUpdate);
    };
  }, [dispatch, socket.connected]);

  const statusBadgeMap: Record<OrderStatus, React.ReactElement> = {
    [OrderStatus.Preparation]: <Badge className="bg-blue-500">Preparation</Badge>,
    [OrderStatus.Ontheway]: <Badge className="bg-yellow-500">On the way</Badge>,
    [OrderStatus.Delivered]: <Badge className="bg-green-500">Delivered</Badge>,
    [OrderStatus.Cancelled]: <Badge variant="destructive">Cancelled</Badge>,
    [OrderStatus.Pending]: <Badge variant="outline">Pending</Badge>,
  };

  const paymentMethodMap: Record<PaymentMethod, string> = {
    [PaymentMethod.Khalti]: "Khalti",
    [PaymentMethod.Esewa]: "Esewa",
    [PaymentMethod.COD]: "COD",
  };

  const paymentStatusMap: Record<PaymentStatus, React.ReactElement> = {
    [PaymentStatus.Paid]: <Badge className="bg-green-500">Paid</Badge>,
    [PaymentStatus.Unpaid]: <Badge variant="destructive">Unpaid</Badge>,
  };

  const getStatusBadge = (status: string) => {
    return statusBadgeMap[status as OrderStatus] ?? <Badge variant="outline">Pending</Badge>;
  };

  const getPaymentStatus = (status: string) => {
    return paymentStatusMap[status as PaymentStatus] ?? (
      <Badge variant="destructive">Unpaid</Badge>
    );
  };

  if (status === "loading") {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
              <p className="text-muted-foreground">
                Manage and track all customer orders
              </p>
            </div>
          </div>
          <Card>
            <CardContent className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading orders...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  if (status === "error") {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
              <p className="text-muted-foreground">
                Manage and track all customer orders
              </p>
            </div>
          </div>
          <Card>
            <CardContent className="flex justify-center items-center h-64">
              <div className="text-center">
                <p className="text-destructive mb-2">Error loading orders</p>
                <button 
                  onClick={() => dispatch(fetchOrders())}
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
            <p className="text-muted-foreground">
              Manage and track all customer orders
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              {items.length} Total Orders
            </Badge>
          </div>
        </div>
        
      <Card>
          <CardHeader>
            <CardTitle>Order Management</CardTitle>
            <CardDescription>View and manage all customer orders from your store.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-center">
                      <p className="text-muted-foreground mb-2">No orders found</p>
                      <p className="text-sm text-muted-foreground">
                        Orders will appear here when customers place them
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                [...items]
                .sort(
                  (a, b) =>
                    new Date(b.OrderDetail.createdAt).getTime() -
                    new Date(a.OrderDetail.createdAt).getTime()
                )
                  .map((order, index) => (
                  <TableRow key={`${order.id}-${index}`}>
                    <TableCell className="font-medium">
                      <Link href={`/orders/${order.id}`} className="text-primary hover:underline">
                        #{order.id}
                      </Link>
                    </TableCell>
                    <TableCell>{order.OrderDetail?.quantity || 0} items</TableCell>
                    <TableCell>
                      {order.Payment?.paymentMethod ? paymentMethodMap[order.Payment.paymentMethod as PaymentMethod] || "Unknown" : "Unknown"}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{getPaymentStatus(order.Payment?.paymentStatus)}</TableCell>
                    <TableCell className="text-right">
                      ${order.totalPrice.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}