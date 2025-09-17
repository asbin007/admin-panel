"use client";

import {
  DollarSign,
  ShoppingCart,
  CheckCircle,
  Clock,
  Loader2,
  TrendingUp,
  Package,
  Users,
  Settings,
  ArrowRight,
  ShoppingBag,
  Star,
  MessageSquare,
  Download,
  Activity,
  PieChart,
  AlertTriangle,
  RefreshCw,
  Zap,
  Target,
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
import AdminLayout from "../adminLayout/adminLayout";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useEffect, useState, useMemo, useCallback } from "react";
import { fetchOrders } from "@/store/orderSlice";
import { fetchProducts } from "@/store/productSlice";
import { fetchUsers } from "@/store/authSlice";
import { fetchAllReviews } from "@/store/reviewsSlice";
import { fetchAllChats } from "@/store/chatSlice";
import Link from "next/link";
import Image from "next/image";

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

interface OrderData {
  id: string;
  createdAt?: string;
  orderItems?: OrderItem[];
  Order?: {
    createdAt?: string;
    totalAmount?: number;
    orderItems?: OrderItem[];
    Payment?: {
      paymentMethod?: string;
    };
    status?: string;
  };
  totalAmount?: number;
  totalPrice?: number;
  paymentMethod?: string;
  status?: string;
  orderStatus?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  User?: {
    username?: string;
    phoneNumber?: string;
  };
  Customer?: {
    username?: string;
    phoneNumber?: string;
  };
}

interface ProductData {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  stock?: number;
  totalStock?: number;
  totalQuantitySold?: number;
  totalRevenue?: number;
  totalProfit?: number;
  image?: string;
}

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { items: orders, status } = useAppSelector((store) => store.orders);
  const { products } = useAppSelector((store) => store.adminProducts);
  const { user: users } = useAppSelector((store) => store.auth);
  const { items: reviews } = useAppSelector((store) => store.reviews);
  const { chats } = useAppSelector((store) => store.chat);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [realTimeData, setRealTimeData] = useState({
    lastUpdated: new Date(),
    isLive: false,
    refreshInterval: 30000, // 30 seconds
  });

  // Real-time data refresh function
  const refreshRealTimeData = useCallback(async () => {
    try {
      setRealTimeData(prev => ({ ...prev, isLive: true }));
      
      await Promise.all([
        dispatch(fetchOrders()),
        dispatch(fetchProducts()),
        dispatch(fetchUsers()),
        dispatch(fetchAllReviews()),
        dispatch(fetchAllChats())
      ]);
      
      setRealTimeData(prev => ({ 
        ...prev, 
        lastUpdated: new Date(),
        isLive: false 
      }));
    } catch (error) {
      console.error('❌ Error refreshing real-time data:', error);
      setRealTimeData(prev => ({ ...prev, isLive: false }));
    }
  }, [dispatch]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshRealTimeData();
    }, realTimeData.refreshInterval);

    return () => clearInterval(interval);
  }, [refreshRealTimeData, realTimeData.refreshInterval]);

  // Core Business Metrics - Clean and focused
  const businessMetrics = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        averageOrderValue: 0,
        monthlyRevenue: 0,
        dailyRevenue: 0,
        totalProfit: 0,
        profitMargin: 0,
        totalProducts: products?.length || 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        totalCustomers: users?.length || 0,
        totalReviews: reviews?.length || 0,
        activeChats: chats?.length || 0,
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = now.getDate();

    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let dailyRevenue = 0;
    let totalProfit = 0;
    let totalCost = 0;

    // Process orders for revenue
    orders.forEach((order: OrderData) => {
      const orderDate = new Date(order.createdAt || order.Order?.createdAt || new Date());
      const orderMonth = orderDate.getMonth();
      const orderYear = orderDate.getFullYear();
      const orderDay = orderDate.getDate();
      
      const orderTotal = order.totalAmount || order.Order?.totalAmount || order.totalPrice || 0;
      totalRevenue += orderTotal;

      // Monthly revenue
      if (orderMonth === currentMonth && orderYear === currentYear) {
        monthlyRevenue += orderTotal;
      }

      // Daily revenue
      if (orderDay === today && orderMonth === currentMonth && orderYear === currentYear) {
        dailyRevenue += orderTotal;
      }
    });

    // Process products for profit calculation
    if (products && products.length > 0) {
      products.forEach((product: ProductData) => {
        const costPrice = product.costPrice || (product.price || 0) * 0.7;
        const profitPerUnit = (product.price || 0) - costPrice;
        const quantitySold = product.totalQuantitySold || 0;
        
        totalCost += costPrice * quantitySold;
        totalProfit += profitPerUnit * quantitySold;
      });
    }

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => {
      const status = order.orderStatus || order.status || order.Order?.status;
      return status === 'pending' || status === 'preparation';
    }).length;
    
    const completedOrders = orders.filter(order => {
      const status = order.orderStatus || order.status || order.Order?.status;
      return status === 'delivered';
    }).length;
    
    const cancelledOrders = orders.filter(order => {
      const status = order.orderStatus || order.status || order.Order?.status;
      return status === 'cancelled';
    }).length;

    // Stock analysis
    const lowStockProducts = products?.filter(p => (p.totalStock || 0) > 0 && (p.totalStock || 0) <= 5).length || 0;
    const outOfStockProducts = products?.filter(p => (p.totalStock || 0) === 0).length || 0;

    return {
      totalRevenue,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      monthlyRevenue,
      dailyRevenue,
      totalProfit,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      totalProducts: products?.length || 0,
      lowStockProducts,
      outOfStockProducts,
      totalCustomers: users?.length || 0,
      totalReviews: reviews?.length || 0,
      activeChats: chats?.length || 0,
    };
  }, [orders, products, users, reviews, chats]);

  // Top selling products
  const topSellingProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    return products
      .map(product => ({
        ...product,
        quantitySold: product.totalQuantitySold || 0,
        revenue: product.totalRevenue || 0,
        profit: (product.totalQuantitySold || 0) * ((product.price || 0) - (product.costPrice || 0)),
        stock: product.totalStock || 0,
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);
  }, [products]);

  // Recent orders
  const recentOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    
    return [...orders]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5)
      .map(order => {
        let fullName = 'Customer';
        let phone = '';
        
        if (order.Order && order.Order.firstName && order.Order.lastName) {
          fullName = `${order.Order.firstName} ${order.Order.lastName}`;
          phone = order.Order.phoneNumber || `#${order.id.slice(-6)}`;
        } else if (order.firstName && order.lastName) {
          fullName = `${order.firstName} ${order.lastName}`;
          phone = order.phoneNumber || `#${order.id.slice(-6)}`;
        } else if (order.User && order.User.username) {
          fullName = order.User.username;
          phone = order.User.phoneNumber || `#${order.id.slice(-6)}`;
        } else if (order.Customer && order.Customer.username) {
          fullName = order.Customer.username;
          phone = order.Customer.phoneNumber || `#${order.id.slice(-6)}`;
        } else {
          fullName = `Order #${order.id.slice(-6)}`;
          phone = `#${order.id.slice(-6)}`;
        }
        
        return {
          id: order.id,
          fullName,
          status: order.orderStatus || order.status || order.Order?.status || 'pending',
          amount: order.totalPrice || order.Order?.totalPrice || 0,
          phone,
          createdAt: order.createdAt || order.Order?.createdAt || new Date().toISOString()
        };
      });
  }, [orders]);

  // Fetch data on component mount
  useEffect(() => {
    if (isInitialLoad) {
      dispatch(fetchOrders());
      dispatch(fetchProducts());
      dispatch(fetchUsers());
      dispatch(fetchAllReviews());
      dispatch(fetchAllChats());
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
      ['Metric', 'Value'],
      ['Total Revenue', `Rs ${businessMetrics.totalRevenue.toFixed(2)}`],
      ['Total Orders', businessMetrics.totalOrders.toString()],
      ['Pending Orders', businessMetrics.pendingOrders.toString()],
      ['Completed Orders', businessMetrics.completedOrders.toString()],
      ['Cancelled Orders', businessMetrics.cancelledOrders.toString()],
      ['Average Order Value', `Rs ${businessMetrics.averageOrderValue.toFixed(2)}`],
      ['Monthly Revenue', `Rs ${businessMetrics.monthlyRevenue.toFixed(2)}`],
      ['Daily Revenue', `Rs ${businessMetrics.dailyRevenue.toFixed(2)}`],
      ['Total Profit', `Rs ${businessMetrics.totalProfit.toFixed(2)}`],
      ['Profit Margin', `${businessMetrics.profitMargin.toFixed(1)}%`],
      ['Total Products', businessMetrics.totalProducts.toString()],
      ['Low Stock Products', businessMetrics.lowStockProducts.toString()],
      ['Out of Stock Products', businessMetrics.outOfStockProducts.toString()],
      ['Total Customers', businessMetrics.totalCustomers.toString()],
      ['Total Reviews', businessMetrics.totalReviews.toString()],
      ['Active Chats', businessMetrics.activeChats.toString()],
    ];

    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `shoe-store-dashboard-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [businessMetrics]);

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

  // Error state
  if (status === 'error') {
    return (
      <AdminLayout>
        <div className="flex-1 space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-muted-foreground">Shoe Store Admin Panel</p>
            </div>
          </div>

          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertTriangle className="h-5 w-5" />
                Backend Connection Error
              </CardTitle>
              <CardDescription className="text-red-600 dark:text-red-400">
                Unable to connect to the backend server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  The admin panel cannot load data because the backend server is experiencing issues.
                </p>
                <Button 
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 space-y-6 p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Shoe Store Dashboard</h2>
            <p className="text-muted-foreground">Real-time business analytics and management</p>
            
            {/* Real-time Status */}
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${realTimeData.isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-xs text-muted-foreground">
                {realTimeData.isLive ? 'Live updating...' : `Last updated: ${realTimeData.lastUpdated.toLocaleTimeString()}`}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center gap-2">
              <select 
                value={realTimeData.refreshInterval / 1000}
                onChange={(e) => setRealTimeData(prev => ({ 
                  ...prev, 
                  refreshInterval: parseInt(e.target.value) * 1000 
                }))}
                className="text-xs px-2 py-1 border rounded"
              >
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={300}>5m</option>
              </select>
              <Button 
                onClick={refreshRealTimeData}
                disabled={realTimeData.isLive}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 ${realTimeData.isLive ? 'animate-spin' : ''}`} />
                {realTimeData.isLive ? 'Updating...' : 'Refresh'}
              </Button>
            </div>
            <Button 
              onClick={downloadDashboardData} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {formatPrice(businessMetrics.totalRevenue)}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                All time earnings
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {businessMetrics.totalOrders}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {businessMetrics.averageOrderValue > 0 ? `Avg: ${formatPrice(businessMetrics.averageOrderValue)}` : 'No orders yet'}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Total Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatPrice(businessMetrics.totalProfit)}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">
                {businessMetrics.profitMargin.toFixed(1)}% margin
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">Monthly Revenue</CardTitle>
              <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {formatPrice(businessMetrics.monthlyRevenue)}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                This month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Order Status Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {businessMetrics.pendingOrders}
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                Awaiting processing
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Completed Orders</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {businessMetrics.completedOrders}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">
                Successfully delivered
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">Cancelled Orders</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {businessMetrics.cancelledOrders}
              </div>
              <p className="text-xs text-red-600 dark:text-red-400">
                Cancelled by customers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Status */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Total Products</CardTitle>
              <Package className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                {businessMetrics.totalProducts}
              </div>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">
                In catalog
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {businessMetrics.lowStockProducts}
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                Need restocking
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">Out of Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {businessMetrics.outOfStockProducts}
              </div>
              <p className="text-xs text-red-600 dark:text-red-400">
                Urgent restock needed
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
                <div className="text-2xl font-bold text-blue-600">{businessMetrics.totalOrders}</div>
                <p className="text-sm text-muted-foreground">Total orders in system</p>
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
                    <CardDescription>Manage shoe catalog</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 transition-colors duration-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{businessMetrics.totalProducts}</div>
                <p className="text-sm text-muted-foreground">Shoes in catalog</p>
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
                <div className="text-2xl font-bold text-green-600">{businessMetrics.totalCustomers}</div>
                <p className="text-sm text-muted-foreground">Registered customers</p>
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
                    <CardDescription>Customer feedback</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-yellow-600 transition-colors duration-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{businessMetrics.totalReviews}</div>
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
                    <CardTitle className="text-lg font-semibold">Support</CardTitle>
                    <CardDescription>Customer support chat</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 transition-colors duration-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">{businessMetrics.activeChats}</div>
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

        {/* Top Selling Products */}
        {topSellingProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Top Selling Shoes
                {realTimeData.isLive && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </CardTitle>
              <CardDescription>
                Best performing products in your shoe store
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSellingProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <Image
                        src={product.images?.[0] || '/placeholder-image.svg'}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="rounded object-cover"
                      />
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(product.price)} • {product.quantitySold} sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatPrice(product.revenue)}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Recent Orders
                {realTimeData.isLive && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </CardTitle>
              <CardDescription>
                Latest customer orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{order.fullName}</p>
                        <p className="text-sm text-muted-foreground">{order.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatPrice(order.amount)}</p>
                      <Badge 
                        className={
                          order.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}