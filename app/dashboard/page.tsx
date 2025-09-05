"use client";

import {
  DollarSign,
  ShoppingCart,
  CheckCircle,
  Clock,
  Loader2,
  TrendingUp,
  BarChart3,
  Package,
  Users,
  Settings,
  ArrowRight,
  ShoppingBag,
  Star,
  MessageSquare,
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
import AdminLayout from "../adminLayout/adminLayout";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useEffect, useState, useMemo, useCallback } from "react";
import { fetchOrders } from "@/store/orderSlice";
import { fetchProducts } from "@/store/productSlice";
import { useAppDispatch } from "@/store/hooks";
import { Download } from "lucide-react";
import ClientOnly from "@/components/ClientOnly";
import Link from "next/link";

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { items: orders, status } = useAppSelector((store) => store.orders);
  const { products } = useAppSelector((store) => store.adminProducts);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Debug: Log orders from Redux store
  console.log('🔍 Debug - Orders from Redux store:', orders);
  console.log('🔍 Debug - Orders length:', orders.length);
  console.log('🔍 Debug - Orders status:', status);

  // Use real orders data only
  const displayOrders = orders;
  console.log('🔍 Debug - Using orders:', displayOrders.length > 0 ? 'real' : 'none');

  // Memoized stats calculation
  const stats = useMemo(() => {
    if (displayOrders.length === 0) {
      console.log('🔍 Debug - No orders found, returning zero stats');
      return {
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
      };
    }

    // Debug: Log the first order to see its structure
    console.log('🔍 Debug - First order structure:', displayOrders[0]);
    console.log('🔍 Debug - Order.totalPrice:', displayOrders[0]?.totalPrice);
    console.log('🔍 Debug - Order.status:', displayOrders[0]?.status);

    const totalRevenue = displayOrders.reduce((sum, order) => {
      const price = order.totalPrice || 0;
      console.log('🔍 Debug - Order price:', price, 'for order:', order.id);
      return sum + price;
    }, 0);
    
    const totalOrders = displayOrders.length;
    const pendingOrders = displayOrders.filter(order => {
      const status = order.orderStatus || order.status;
      console.log('🔍 Debug - Order status:', status, 'for order:', order.id);
      return status === 'pending' || status === 'preparation';
    }).length;
    const completedOrders = displayOrders.filter(order => {
      const status = order.orderStatus || order.status;
      return status === 'delivered';
    }).length;
    const cancelledOrders = displayOrders.filter(order => {
      const status = order.orderStatus || order.status;
      return status === 'cancelled';
    }).length;

    console.log('🔍 Debug - Calculated stats:', {
      totalRevenue,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
    });

    // Debug: Log order statuses
    console.log('📊 Dashboard Stats Debug:');
    console.log('Total orders:', orders.length);
    console.log('Sample order structure:', orders[0]);
    console.log('Order statuses:', orders.map(order => ({ 
      id: order.id, 
      status: order.status,
      totalPrice: order.totalPrice,
      hasOrderDetail: !!order.OrderDetail,
      hasPayment: !!order.Payment
    })));
    
    // Check for different status formats
    const uniqueStatuses = [...new Set(orders.map(order => order.status))];
    console.log('🔍 Unique statuses found:', uniqueStatuses);
    
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => {
      const status = order.status?.toLowerCase();
      return status === 'pending' || status === 'preparation' || status === 'ontheway';
    }).length;
    
    const completedOrders = orders.filter(order => {
      const status = order.status?.toLowerCase();
      return status === 'delivered';
    }).length;
    
    const cancelledOrders = orders.filter(order => {
      const status = order.status?.toLowerCase();
      return status === 'cancelled';
    }).length;

    // Debug: Check what orders are being filtered as completed
    const completedOrdersList = orders.filter(order => {
      const status = order.status?.toLowerCase();
      return status === 'delivered';
    });
    console.log('✅ Completed orders found:', completedOrdersList.length);
    console.log('✅ Completed orders details:', completedOrdersList.map(order => ({ 
      id: order.id, 
      status: order.status,
      totalPrice: order.totalPrice 
    })));

    console.log('📈 Calculated stats:', {
      totalRevenue,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
    });

    return {
      totalRevenue,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
    };

    return {
      totalRevenue,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
    };
  }, [displayOrders]);

  // Memoized recent orders data
  const recentOrders = useMemo(() => {
    if (displayOrders.length === 0) return [];
    
    console.log('🔍 Debug - Recent orders calculation:', displayOrders.length);
    console.log('🔍 Debug - First order structure:', displayOrders[0]);
    
    return [...displayOrders]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5)
      .map(order => {
        // Debug order structure
        console.log('🔍 Debug - Order structure:', order);
        console.log('🔍 Debug - Order.Order:', order.Order);
        console.log('🔍 Debug - Order.firstName:', order.firstName);
        console.log('🔍 Debug - Order.lastName:', order.lastName);
        
        // Try multiple ways to get customer name
        let fullName = 'Customer';
        let phone = '';
        
        // Method 1: Check if order has Order object (nested structure) - Primary method
        if (order.Order && order.Order.firstName && order.Order.lastName) {
          fullName = `${order.Order.firstName} ${order.Order.lastName}`;
          phone = order.Order.phoneNumber || `#${order.id.slice(-6)}`;
        }
        // Method 2: Check if order has Order object with just firstName
        else if (order.Order && order.Order.firstName) {
          fullName = order.Order.firstName;
          phone = order.Order.phoneNumber || `#${order.id.slice(-6)}`;
        }
        // Method 3: Check direct properties
        else if (order.firstName && order.lastName) {
          fullName = `${order.firstName} ${order.lastName}`;
          phone = order.phoneNumber || `#${order.id.slice(-6)}`;
        }
        // Method 4: Check direct firstName only
        else if (order.firstName) {
          fullName = order.firstName;
          phone = order.phoneNumber || `#${order.id.slice(-6)}`;
        }
        // Method 5: Check if there's a User object
        else if (order.User && order.User.username) {
          fullName = order.User.username;
          phone = order.User.phoneNumber || `#${order.id.slice(-6)}`;
        }
        // Method 6: Check if there's a Customer object
        else if (order.Customer && order.Customer.username) {
          fullName = order.Customer.username;
          phone = order.Customer.phoneNumber || `#${order.id.slice(-6)}`;
        }
        // Method 7: Use order ID as fallback
        else if (order.id) {
          fullName = `Order #${order.id.slice(-6)}`;
          phone = `#${order.id.slice(-6)}`;
        }
        
        return {
          id: order.id,
          fullName,
          status: order.orderStatus || order.status || 'pending',
          amount: `Rs ${(order.totalPrice || 0).toFixed(2)}`,
          phone: phone || `#${order.id.slice(-6)}`,
          createdAt: order.createdAt || new Date().toISOString()
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
    
    return Object.values(monthlyData);
  }, [orders]);

  // Memoized recent products data
  const recentProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    console.log('🔍 Debug - Recent products calculation:', products.length);
    
    return [...products]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5)
      .map(product => ({
        id: product.id,
        name: product.name || 'Unnamed Product',
        brand: product.brand || 'Unknown Brand',
        price: product.price || 0,
        inStock: product.inStock || false,
        category: product.Category?.categoryName || 'Uncategorized',
        createdAt: product.createdAt || new Date().toISOString(),
        image: product.images?.[0] || null
      }));
  }, [products]);



  // Fetch orders and products only once on component mount
  useEffect(() => {
    if (isInitialLoad) {
      console.log('🔍 Debug - Fetching orders and products on component mount');
      dispatch(fetchOrders());
      dispatch(fetchProducts());
      setIsInitialLoad(false);
    }
  }, [dispatch, isInitialLoad]);



  const formatPrice = useCallback((price: number) => {
    return `Rs ${price.toFixed(2)}`;
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
      ['Cancelled Orders', stats.cancelledOrders.toString()],
      ['Average Order Value', stats.totalOrders > 0 ? `Rs ${(stats.totalRevenue / stats.totalOrders).toFixed(2)}` : 'Rs 0.00'],
      ['', ''], // Empty row for spacing
      ['Recent Orders Details', ''],
      ['Customer Name', 'Status', 'Date', 'Amount', 'Phone Number'],
      // Order details
      ...recentOrders.map(order => [
        `${order.fullName}`,
        order.status,
        formatDate(order.createdAt || ''),
        order.amount,
        order.phone
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
        <ClientOnly 
          fallback={
            <div className="w-full h-screen flex justify-center items-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading dashboard...</p>
              </div>
            </div>
          }
        >
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading dashboard data...</p>
            </div>
          </div>
        </ClientOnly>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <ClientOnly 
        fallback={
          <div className="w-full h-screen flex justify-center items-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        }
      >
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-muted-foreground">Welcome to your admin panel</p>
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

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            
            <Card className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800/50 hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Pending Orders</CardTitle>
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/50 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800/70 transition-colors duration-300">
                  <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pendingOrders}</div>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
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
          </div>

          {/* Quick Access Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/orders">
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-500 hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/70 transition-colors duration-300">
                      <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">Orders</CardTitle>
                      <CardDescription>Manage all orders</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors duration-300" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
                  <p className="text-sm text-muted-foreground">Total orders in system</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/userTable">
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-green-500 hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50 group-hover:bg-green-200 dark:group-hover:bg-green-800/70 transition-colors duration-300">
                      <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">Customers</CardTitle>
                      <CardDescription>Manage customer accounts</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-green-600 transition-colors duration-300" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.totalOrders}</div>
                  <p className="text-sm text-muted-foreground">Registered customers</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/products">
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-purple-500 hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/70 transition-colors duration-300">
                      <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">Products</CardTitle>
                      <CardDescription>Manage product catalog</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 transition-colors duration-300" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{products?.length || 0}</div>
                  <p className="text-sm text-muted-foreground">Products in catalog</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/reviews">
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-yellow-500 hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/50 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800/70 transition-colors duration-300">
                      <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">Reviews</CardTitle>
                      <CardDescription>Manage product reviews</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-yellow-600 transition-colors duration-300" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.completedOrders}</div>
                  <p className="text-sm text-muted-foreground">Customer reviews</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/chat">
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-indigo-500 hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/70 transition-colors duration-300">
                      <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">Chat</CardTitle>
                      <CardDescription>Customer support chat</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 transition-colors duration-300" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-600">{stats.pendingOrders}</div>
                  <p className="text-sm text-muted-foreground">Active conversations</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/settings">
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-gray-500 hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900/50 group-hover:bg-gray-200 dark:group-hover:bg-gray-800/70 transition-colors duration-300">
                      <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">Settings</CardTitle>
                      <CardDescription>System configuration</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-gray-600 transition-colors duration-300" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-600">Config</div>
                  <p className="text-sm text-muted-foreground">System settings</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recent Orders Section */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Orders
                </CardTitle>
                <CardDescription>Latest orders from customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recent orders found</p>
                    </div>
                  ) : (
                    recentOrders.map((order, index) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{order.fullName}</p>
                            <p className="text-sm text-muted-foreground">{order.phone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{order.amount}</p>
                          <Badge 
                            variant={order.status === 'delivered' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'}
                            className={order.status === 'delivered' ? 'bg-green-500' : order.status === 'pending' ? 'bg-yellow-500' : order.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-500'}
                          >
                            {order.status === 'N/A' ? 'Pending' : order.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Link href="/orders">
                    <Button variant="outline" className="w-full">
                      View All Orders
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Order Analytics
                </CardTitle>
                <CardDescription>Order status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                    <span className="text-sm font-bold">{stats.pendingOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                    <span className="text-sm font-bold">{stats.completedOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm font-medium">Cancelled</span>
                    </div>
                    <span className="text-sm font-bold">{stats.cancelledOrders}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Link href="/chart">
                    <Button variant="outline" className="w-full">
                      View Detailed Analytics
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Products Section */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Recent Products
                </CardTitle>
                <CardDescription>Latest products added to catalog</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentProducts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recent products found</p>
                    </div>
                  ) : (
                    recentProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.brand} • {product.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(product.price)}</p>
                          <Badge 
                            variant={product.inStock ? "default" : "secondary"}
                            className={product.inStock ? "bg-green-500" : "bg-gray-500"}
                          >
                            {product.inStock ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Link href="/products">
                    <Button variant="outline" className="w-full">
                      View All Products
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Product Analytics
                </CardTitle>
                <CardDescription>Product inventory overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium">In Stock</span>
                    </div>
                    <span className="text-sm font-bold">
                      {products?.filter(p => p.inStock).length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm font-medium">Out of Stock</span>
                    </div>
                    <span className="text-sm font-bold">
                      {products?.filter(p => !p.inStock).length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium">Total Products</span>
                    </div>
                    <span className="text-sm font-bold">{products?.length || 0}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Link href="/products">
                    <Button variant="outline" className="w-full">
                      Manage Products
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ClientOnly>
    </AdminLayout>
  );
}