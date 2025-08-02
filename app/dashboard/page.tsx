"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CircleUser,
  DollarSign,
  Menu,
  Package2,
  Search,
  Users,
  ShoppingCart,
  CheckCircle,
  Clock,
  Star,
  Loader2,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminLayout from "../adminLayout/adminLayout";
import { useAppSelector } from "@/store/hooks";
import { useEffect, useState, useMemo, useCallback } from "react";
import { fetchOrders } from "@/store/orderSlice";
import { useAppDispatch } from "@/store/hooks";


interface Order {
  id: string;
  totalPrice: number;
  status: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  createdAt?: string;
  Order?: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    totalPrice: number;
    status: string;
  };
}

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { items: orders, status } = useAppSelector((store) => store.orders);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Memoized stats calculation
  const stats = useMemo(() => {
    if (orders.length === 0) {
      return {
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
      };
    }

      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(order => 
        order.status === 'pending' || order.status === 'preparation'
      ).length;
      const completedOrders = orders.filter(order => 
        order.status === 'delivered'
      ).length;

    return {
        totalRevenue,
        totalOrders,
        pendingOrders,
        completedOrders,
    };
  }, [orders]);

  // Memoized recent orders
  const recentOrders = useMemo(() => {
    if (orders.length === 0) return [];
    
    return orders.slice(0, 5).map(order => {
      // Try to get customer info from order details if available
      const orderDetail = order.OrderDetail;
      const customerName = orderDetail?.Order?.firstName 
        ? `${orderDetail.Order.firstName} ${orderDetail.Order.lastName || ''}`
        : `Customer #${order.id.slice(-4)}`;
      
      return {
        id: order.id,
        totalPrice: order.totalPrice || 0,
        status: order.status || 'pending',
        firstName: orderDetail?.Order?.firstName || 'Customer',
        lastName: orderDetail?.Order?.lastName || `#${order.id.slice(-4)}`,
        phoneNumber: orderDetail?.Order?.phoneNumber || 'N/A',
        createdAt: orderDetail?.createdAt || new Date().toISOString(),
        Order: {
          firstName: orderDetail?.Order?.firstName || 'Customer',
          lastName: orderDetail?.Order?.lastName || `#${order.id.slice(-4)}`,
          phoneNumber: orderDetail?.Order?.phoneNumber || 'N/A',
          totalPrice: order.totalPrice || 0,
          status: order.status || 'pending'
        }
      };
    });
  }, [orders]);

  // Memoized monthly analytics data
  const monthlyAnalytics = useMemo(() => {
    if (orders.length === 0) return [];
    
    // Group orders by month and calculate revenue
    const monthlyData = orders.reduce((acc, order) => {
      const date = new Date(order.createdAt || new Date());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthName,
          revenue: 0,
          orders: 0,
          color: `hsl(${Math.random() * 360}, 70%, 50%)`
        };
      }
      
      acc[monthKey].revenue += order.totalPrice || 0;
      acc[monthKey].orders += 1;
      
      return acc;
    }, {} as Record<string, { month: string; revenue: number; orders: number; color: string }>);
    
    // Convert to array and sort by month
    return Object.values(monthlyData)
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6); // Last 6 months
  }, [orders]);

  // Fetch orders only once on component mount
  useEffect(() => {
    if (isInitialLoad) {
      dispatch(fetchOrders());
      setIsInitialLoad(false);
    }
  }, [dispatch, isInitialLoad]);

  // Memoized status badge function
  const getStatusBadge = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <Badge className="bg-green-500">Delivered</Badge>;
      case 'preparation':
        return <Badge className="bg-blue-500">Preparation</Badge>;
      case 'ontheway':
        return <Badge className="bg-yellow-500">On the way</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }, []);

  // Memoized format functions
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NPR',
    }).format(price);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Loading state
  if (status === 'loading' && isInitialLoad) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Empty state when no orders
  if (orders.length === 0 && status === 'success') {
    return (
      <AdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹0.00</div>
                <p className="text-xs text-muted-foreground">No sales yet</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">No orders yet</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">No pending orders</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">No completed orders</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">No orders yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Orders will appear here once customers start shopping</p>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CircleUser className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">No sales yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Sales will appear here once orders are placed</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <Button>Download</Button>
            </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                +180.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">
                +19% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedOrders}</div>
              <p className="text-xs text-muted-foreground">
                +201 since last hour
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalOrders > 0 ? formatPrice(stats.totalRevenue / stats.totalOrders) : formatPrice(0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per order average
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                      {recentOrders.map((order, index) => (
                    <TableRow key={`order-${order.id}-${index}`}>
                      <TableCell className="font-medium">
                        {order.firstName} {order.lastName}
                    </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{formatDate(order.createdAt || '')}</TableCell>
                          <TableCell className="text-right">
                            {formatPrice(order.totalPrice)}
                    </TableCell>
                  </TableRow>
                      ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Monthly Analytics</CardTitle>
              <CardDescription>
                Revenue trends over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyAnalytics.length > 0 ? (
                <div className="space-y-4">
                  {monthlyAnalytics.map((data, index) => (
                    <div key={`analytics-${index}`} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{data.month}</span>
                        <span className="text-sm text-muted-foreground">
                          {data.orders} orders
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min((data.revenue / Math.max(...monthlyAnalytics.map(d => d.revenue))) * 100, 100)}%`,
                            backgroundColor: data.color
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Revenue</span>
                        <span className="font-medium text-green-600">
                          {formatPrice(data.revenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No analytics data available
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Analytics will appear here once orders are placed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
    </AdminLayout>
  );
}
