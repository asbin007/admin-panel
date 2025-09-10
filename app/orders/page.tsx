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
import { useEffect, useState } from "react";
import { fetchOrders, deleteOrder, bulkDeleteOrders, type IOrder } from "@/store/orderSlice";
import { socket } from "@/app/app";
import Link from "next/link";
import { Trash2, MoreHorizontal, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Enums
enum OrderStatus {
  Preparation = "preparation",
  Ontheway = "ontheway",
  Delivered = "delivered",
  Pending = "pending",
  Cancelled = "cancelled",
}

enum PaymentMethod {
  Khalti = "khalti",
  Esewa = "esewa",
  COD = "cod",
}

enum PaymentStatus {
  Paid = "paid",
  Unpaid = "unpaid",
}

export default function Orders() {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((store) => store.orders);
  
  // Delete functionality state
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  // Listen for order status updates from WebSocket and auto-refresh
  useEffect(() => {
    // Check if socket is already connected and authenticated
    if (!socket.connected) {
      console.log('Orders page: Socket not connected (WebSocket may be disabled)');
      return;
    }
    
    console.log('Orders page: Socket connected, setting up listeners');

    const handleOrderStatusUpdate = () => {
      // Refresh orders list when status is updated
      console.log('🔄 Order status updated, refreshing orders list');
      dispatch(fetchOrders());
    };

    const handlePaymentStatusUpdate = () => {
      // Refresh orders list when payment status is updated
      console.log('🔄 Payment status updated, refreshing orders list');
      dispatch(fetchOrders());
    };

    // Listen for WebSocket events
    socket.on("orderStatusUpdated", handleOrderStatusUpdate);
    socket.on("paymentStatusUpdated", handlePaymentStatusUpdate);

    // Auto-refresh orders every 30 seconds as fallback
    const autoRefreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing orders list (30s interval)');
      dispatch(fetchOrders());
    }, 30000);

    // Cleanup listeners and interval
    return () => {
      socket.off("orderStatusUpdated", handleOrderStatusUpdate);
      socket.off("paymentStatusUpdated", handlePaymentStatusUpdate);
      clearInterval(autoRefreshInterval);
    };
  }, [dispatch]);

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

  // Delete handlers
  const handleDeleteOrder = async (orderId: string) => {
    try {
      setIsDeleting(true);
      const result = await dispatch(deleteOrder(orderId));
      
      if (result.success) {
        toast.success("Order deleted successfully");
        setDeleteDialogOpen(false);
        setOrderToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete order");
      }
    } catch {
      toast.error("Failed to delete order");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDeleteOrders = async () => {
    if (selectedOrders.length === 0) return;
    
    try {
      setIsDeleting(true);
      const result = await dispatch(bulkDeleteOrders(selectedOrders));
      
      if (result.success) {
        toast.success(`${result.deletedCount || selectedOrders.length} orders deleted successfully`);
        setBulkDeleteDialogOpen(false);
        setSelectedOrders([]);
      } else {
        toast.error(result.error || "Failed to delete orders");
      }
    } catch {
      toast.error("Failed to delete orders");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAllOrders = () => {
    if (selectedOrders.length === items.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(items.map(order => order.id));
    }
  };

  const canDeleteOrder = (order: IOrder) => {
    const orderStatus = order.orderStatus || order.status;
    return orderStatus !== OrderStatus.Delivered;
  };

  const canDeleteSelectedOrders = () => {
    return selectedOrders.every(orderId => {
      const order = items.find(o => o.id === orderId);
      return order && canDeleteOrder(order);
    });
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
            {selectedOrders.length > 0 && (
              <Badge variant="destructive" className="text-sm">
                {selectedOrders.length} Selected
              </Badge>
            )}
            <button 
              onClick={() => {
                console.log('🔄 Manual refresh triggered');
                dispatch(fetchOrders());
              }}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              🔄 Refresh
            </button>
            {selectedOrders.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteDialogOpen(true)}
                disabled={!canDeleteSelectedOrders()}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedOrders.length})
              </Button>
            )}
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
                <TableHead className="w-12">
                  <button
                    onClick={handleSelectAllOrders}
                    className="flex items-center justify-center w-4 h-4"
                  >
                    {selectedOrders.length === items.length ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
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
                    new Date(b.createdAt || 0).getTime() -
                    new Date(a.createdAt || 0).getTime()
                )
                  .map((order, index) => (
                  <TableRow key={`${order.id}-${index}`}>
                    <TableCell>
                      <button
                        onClick={() => handleSelectOrder(order.id)}
                        className="flex items-center justify-center w-4 h-4"
                        disabled={!canDeleteOrder(order)}
                      >
                        {selectedOrders.includes(order.id) ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className={`h-4 w-4 ${canDeleteOrder(order) ? 'text-muted-foreground' : 'text-muted-foreground/50'}`} />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/orders/${order.id}`} className="text-primary hover:underline">
                        #{order.id}
                      </Link>
                    </TableCell>
                    <TableCell>1 item</TableCell>
                    <TableCell>
                      {order.Payment?.paymentMethod ? paymentMethodMap[order.Payment.paymentMethod as PaymentMethod] || "Unknown" : "Unknown"}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.orderStatus || order.status)}</TableCell>
                    <TableCell>{getPaymentStatus(order.Payment?.paymentStatus)}</TableCell>
                    <TableCell className="text-right">
                      Rs {order.totalPrice.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/orders/${order.id}`} className="flex items-center">
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setOrderToDelete(order.id);
                              setDeleteDialogOpen(true);
                            }}
                            disabled={!canDeleteOrder(order)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </AlertDialogDescription>
            {orderToDelete && (
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                Order ID: {orderToDelete}
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => orderToDelete && handleDeleteOrder(orderToDelete)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Orders</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedOrders.length} selected orders? This action cannot be undone.
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                Selected Orders: {selectedOrders.length}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteOrders}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : `Delete ${selectedOrders.length} Orders`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}