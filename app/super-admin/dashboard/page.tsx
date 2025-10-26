"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  ShoppingCart, 
  MessageCircle, 
  Settings, 
  BarChart3, 
  Package, 
  TrendingUp,
  Shield,
  LogOut,
  UserCheck,
  AlertCircle
} from "lucide-react";
import RoleSwitcher from "@/components/RoleSwitcher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APIS } from "@/globals/http";

interface DashboardStats {
  totalUsers: number;
  totalAdmins: number;
  totalOrders: number;
  totalProducts: number;
  totalChats: number;
  totalRevenue: number;
}

interface RecentActivity {
  recentOrders: any[];
  recentProducts: any[];
  recentUsers: any[];
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalAdmins: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalChats: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity>({
    recentOrders: [],
    recentProducts: [],
    recentUsers: []
  });

  useEffect(() => {
    // Check if user is logged in and is super admin
    const userData = localStorage.getItem("userData");
    const token = localStorage.getItem("tokenauth");
    
    if (!userData || !token) {
      router.push("/super-admin/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'super_admin') {
        router.push("/super-admin/login");
        return;
      }
      setUser(parsedUser);
    } catch (error) {
      router.push("/super-admin/login");
      return;
    }

    // Fetch dashboard stats
    fetchDashboardStats();
  }, [router]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      let allUsers = [];
      let orders = [];
      let products = [];
      let chats = [];

      // Fetch users (customers + admins)
      try {
        const usersResponse = await APIS.get("/auth/users");
        allUsers = usersResponse.data.data || [];
      } catch (error: any) {
        console.warn("Failed to fetch users:", error);
      }
      
      // Fetch orders
      try {
        const ordersResponse = await APIS.get("/order/all");
        orders = ordersResponse.data.data || [];
      } catch (error: any) {
        console.warn("Failed to fetch orders:", error);
      }
      
      // Fetch products
      try {
        const productsResponse = await APIS.get("/product");
        products = productsResponse.data.data || [];
      } catch (error: any) {
        console.warn("Failed to fetch products:", error);
        products = [];
      }
      
      // Skip chat stats for super admin (requires admin access)
      chats = [];

      // Calculate stats
      const totalUsers = allUsers.filter((u: any) => u.role === 'customer').length;
      const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.totalPrice || 0), 0);
      
      // Calculate additional stats from real data
      const totalProducts = products.length;
      const totalChats = chats.length;
      
      // Calculate average order value
      const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
      
      // Calculate product categories (if available)
      const productCategories = [...new Set(products.map((p: any) => p.category || 'Uncategorized'))].length;

      setStats({
        totalUsers,
        totalAdmins: 0,
        totalOrders: orders.length,
        totalProducts,
        totalChats,
        totalRevenue
      });

      // Set recent activity data
      setRecentActivity({
        recentOrders: orders.slice(0, 5), // Last 5 orders
        recentProducts: products.slice(0, 5), // Last 5 products
        recentUsers: allUsers.slice(0, 5) // Last 5 users
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("tokenauth");
    localStorage.removeItem("userData");
    router.push("/super-admin/login");
  };

  const switchToAdmin = () => {
    // Switch to admin view
    router.push("/dashboard");
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Super Admin Dashboard
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Welcome back, {user?.username || 'Super Admin'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <RoleSwitcher 
                currentRole="super_admin" 
                currentUser={user}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={switchToAdmin}
              className="h-20 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <div className="text-center">
                <UserCheck className="h-6 w-6 mx-auto mb-2" />
                <div className="text-sm font-medium">Switch to Admin View</div>
              </div>
            </Button>
            <Button 
              onClick={() => router.push("/chat")}
              className="h-20 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
            >
              <div className="text-center">
                <MessageCircle className="h-6 w-6 mx-auto mb-2" />
                <div className="text-sm font-medium">View Chats</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.totalUsers}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Active customers
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Orders
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.totalOrders}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                All time orders
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.totalProducts}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Available products
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Active Chats
              </CardTitle>
              <MessageCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.totalChats}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Customer conversations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                Rs {stats.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                All time revenue
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Orders */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
                <span>Recent Orders</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.recentOrders.length > 0 ? (
                  recentActivity.recentOrders.map((order: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          Order #{order.id?.slice(-8) || 'N/A'}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Rs {order.totalPrice || 0}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {order.orderStatus || 'Unknown'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No recent orders</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Products */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-green-500" />
                <span>Recent Products</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.recentProducts.length > 0 ? (
                  recentActivity.recentProducts.map((product: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {product.name || 'Unnamed Product'}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Rs {product.price || 0}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {product.brand || 'Unknown'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No recent products</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-500" />
                <span>Recent Users</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.recentUsers.length > 0 ? (
                  recentActivity.recentUsers.map((user: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {user.username || 'Unknown User'}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {user.email || 'No email'}
                        </p>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 
                          user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 
                          'bg-green-100 text-green-800'
                        }`}
                      >
                        {user.role || 'customer'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No recent users</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-green-500" />
              <span>System Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Backend Server: Online</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Database: Connected</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">WebSocket: Active</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Admin Panel: Running</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
