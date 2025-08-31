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
import { Download, X } from "lucide-react";


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
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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

  // Search and filter functionality
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return recentOrders;
    
    const searchLower = searchTerm.toLowerCase();
    return recentOrders.filter(order => {
      const fullName = `${order.firstName} ${order.lastName}`.toLowerCase();
      const status = order.status.toLowerCase();
      const amount = order.totalPrice.toString();
      const phone = order.phoneNumber.toLowerCase();
      
      return (
        fullName.includes(searchLower) ||
        status.includes(searchLower) ||
        amount.includes(searchLower) ||
        phone.includes(searchLower)
      );
    });
  }, [recentOrders, searchTerm]);

  // Clear search function
  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setIsSearchFocused(false);
  }, []);



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
      currency: 'INR',
    }).format(price).replace('₹', 'Rs ');
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Download dashboard data as CSV
  const downloadDashboardData = useCallback(() => {
    const csvData = [
      // Headers
      ['Metric', 'Value'],
      ['Total Revenue', `Rs ${stats.totalRevenue.toFixed(2)}`],
      ['Total Orders', stats.totalOrders.toString()],
      ['Pending Orders', stats.pendingOrders.toString()],
      ['Completed Orders', stats.completedOrders.toString()],
      ['Average Order Value', stats.totalOrders > 0 ? `Rs ${(stats.totalRevenue / stats.totalOrders).toFixed(2)}` : 'Rs 0.00'],
      ['', ''], // Empty row for spacing
      ['Recent Orders Details', ''],
      ['Customer Name', 'Status', 'Date', 'Amount', 'Phone Number'],
      // Order details
      ...(searchTerm ? filteredOrders : recentOrders).map(order => [
        `${order.firstName || 'N/A'} ${order.lastName || 'N/A'}`,
        order.status || 'N/A',
        formatDate(order.createdAt || ''),
        `Rs ${(order.totalPrice || 0).toFixed(2)}`,
        order.phoneNumber || 'N/A'
      ])
    ];

    // Convert to CSV string
    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dashboard-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [stats, recentOrders, formatDate]);

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
                <div className="text-2xl font-bold">Rs 0.00</div>
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
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Dashboard
            </h2>
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
              </div>
              <Input
                type="text"
                placeholder="Search orders by name, status, amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="pl-10 pr-10 h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-xl transition-colors duration-200"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                </button>
              )}
            </div>
            {isSearchFocused && searchTerm && (
              <div className="absolute mt-1 w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                  Search results: {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              onClick={downloadDashboardData} 
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0"
            >
              <Download className="h-4 w-4" />
              Download Report
            </Button>
            </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Total Revenue</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/70 transition-colors duration-300">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatPrice(stats.totalRevenue)}</div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800/50 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Orders</CardTitle>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/70 transition-colors duration-300">
                <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalOrders}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                +180.1% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800/50 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">Pending Orders</CardTitle>
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/70 transition-colors duration-300">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.pendingOrders}</div>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                +19% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800/50 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Completed Orders</CardTitle>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50 group-hover:bg-green-200 dark:group-hover:bg-green-800/70 transition-colors duration-300">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.completedOrders}</div>
              <p className="text-xs text-green-600 dark:text-green-400">
                +201 since last hour
              </p>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800/50 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">Avg Order Value</CardTitle>
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/70 transition-colors duration-300">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {stats.totalOrders > 0 ? formatPrice(stats.totalRevenue / stats.totalOrders) : formatPrice(0)}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                Per order average
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 dark:border-l-blue-400">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10">
              <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                  <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search Summary */}
              {searchTerm && (
                <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Search Results for: <span className="font-bold">"{searchTerm}"</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded-full">
                        {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSearch}
                        className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 h-7 px-2"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
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
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order, index) => (
                      <TableRow 
                        key={`order-${order.id}-${index}`}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                {order.firstName.charAt(0)}{order.lastName.charAt(0)}
                              </span>
                            </div>
                            <span className="text-gray-900 dark:text-gray-100">
                              {searchTerm ? (
                                <span dangerouslySetInnerHTML={{
                                  __html: `${order.firstName} ${order.lastName}`.replace(
                                    new RegExp(`(${searchTerm})`, 'gi'),
                                    '<mark class="bg-yellow-200 dark:bg-yellow-800/50 text-yellow-900 dark:text-yellow-200 px-1 rounded">$1</mark>'
                                  )
                                }} />
                              ) : (
                                `${order.firstName} ${order.lastName}`
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(order.status)}
                            {searchTerm && order.status.toLowerCase().includes(searchTerm.toLowerCase()) && (
                              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400">
                          {formatDate(order.createdAt || '')}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {searchTerm && order.totalPrice.toString().includes(searchTerm) ? (
                              <span dangerouslySetInnerHTML={{
                                __html: formatPrice(order.totalPrice).replace(
                                  new RegExp(`(${searchTerm})`, 'gi'),
                                  '<mark class="bg-yellow-200 dark:bg-yellow-800/50 text-yellow-900 dark:text-yellow-200 px-1 rounded">$1</mark>'
                                )
                              }} />
                            ) : (
                              formatPrice(order.totalPrice)
                            )}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                          <Search className="h-8 w-8" />
                          <p className="font-medium">No orders found</p>
                          <p className="text-sm">Try adjusting your search terms</p>
                          {searchTerm && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearSearch}
                              className="mt-2"
                            >
                              Clear Search
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="col-span-3 group hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500 dark:border-l-purple-400">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/10">
              <CardTitle className="text-purple-800 dark:text-purple-200 flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                  <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                Monthly Analytics
              </CardTitle>
              <CardDescription className="text-purple-600 dark:text-purple-400">
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
                      <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700 overflow-hidden">
                        <div 
                          className="h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                          style={{ 
                            width: `${Math.min((data.revenue / Math.max(...monthlyAnalytics.map(d => d.revenue))) * 100, 100)}%`,
                            background: `linear-gradient(90deg, ${data.color} 0%, ${data.color}dd 50%, ${data.color}aa 100%)`
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Revenue</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
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
