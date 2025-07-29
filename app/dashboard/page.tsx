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
import { useEffect, useState } from "react";
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
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  useEffect(() => {
    if (orders.length > 0) {
      // Calculate stats from orders
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(order => 
        order.status === 'pending' || order.status === 'preparation'
      ).length;
      const completedOrders = orders.filter(order => 
        order.status === 'delivered'
      ).length;

      setStats({
        totalRevenue,
        totalOrders,
        pendingOrders,
        completedOrders,
      });

      // Get recent orders (last 5) - show basic info since we don't have user details
      const recent = orders.slice(0, 5).map(order => ({
        id: order.id,
        totalPrice: order.totalPrice || 0,
        status: order.status || '',
        firstName: 'Customer', // Placeholder since basic orders don't have user details
        lastName: `#${order.id.slice(-4)}`, // Show last 4 chars of order ID
        phoneNumber: 'View Details',
        createdAt: order.OrderDetail?.createdAt || new Date().toISOString(),
        Order: {
          firstName: 'Customer',
          lastName: `#${order.id.slice(-4)}`,
          phoneNumber: 'View Details',
          totalPrice: order.totalPrice || 0,
          status: order.status || ''
        }
      }));
      setRecentOrders(recent);
    }
  }, [orders]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm">Delivered</Badge>;
      case 'ontheway':
        return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-sm">On the Way</Badge>;
      case 'preparation':
        return <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm">Preparation</Badge>;
      case 'cancelled':
        return <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-sm">Cancelled</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-sm">Pending</Badge>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NPR',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout>
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="#"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <Package2 className="h-6 w-6" />
              <span className="sr-only">ShoeMart</span>
          </Link>
          <Link
            href="#"
            className="text-foreground transition-colors hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
              href="/orders"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Orders
          </Link>
          <Link
              href="/products"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Products
          </Link>
          <Link
              href="/userTable"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Customers
          </Link>
          <Link
              href="/category"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
              Categories
          </Link>
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="#"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <Package2 className="h-6 w-6" />
                  <span className="sr-only">ShoeMart</span>
              </Link>
              <Link href="#" className="hover:text-foreground">
                Dashboard
              </Link>
              <Link
                  href="/orders"
                className="text-muted-foreground hover:text-foreground"
              >
                Orders
              </Link>
              <Link
                  href="/products"
                className="text-muted-foreground hover:text-foreground"
              >
                Products
              </Link>
              <Link
                  href="/userTable"
                className="text-muted-foreground hover:text-foreground"
              >
                Customers
              </Link>
              <Link
                  href="/category"
                className="text-muted-foreground hover:text-foreground"
              >
                  Categories
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <form className="ml-auto flex-1 sm:flex-initial">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                  placeholder="Search orders, products..."
                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
              />
            </div>
          </form>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/50 dark:to-emerald-900/30 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                Total Revenue
              </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-green-800 dark:text-green-200">{formatPrice(stats.totalRevenue)}</div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  All time revenue from orders
              </p>
            </CardContent>
          </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950/50 dark:to-cyan-900/30 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Total Orders
              </CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{stats.totalOrders}</div>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Total orders received
              </p>
            </CardContent>
          </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/50 dark:to-amber-900/30 border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Pending Orders
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-orange-800 dark:text-orange-200">{stats.pendingOrders}</div>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Orders awaiting processing
              </p>
            </CardContent>
          </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950/50 dark:to-violet-900/30 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Completed Orders
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">{stats.completedOrders}</div>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  Successfully delivered
              </p>
            </CardContent>
          </Card>
        </div>

          {/* Main Content Grid */}
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            {/* Recent Orders Table */}
            <Card className="xl:col-span-2 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-950/50 dark:to-gray-900/30 border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                  <CardTitle className="text-slate-800 dark:text-slate-200">Recent Orders</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Latest orders from your ShoeMart store.
                </CardDescription>
              </div>
                <Button asChild size="sm" className="ml-auto gap-1 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700">
                  <Link href="/orders">
                  View All
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
                {status === "loading" ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : recentOrders.length > 0 ? (
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
                        <TableRow key={`${order.id}-${index}`} className="hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell>
                                                         <div className="font-medium">
                               {order.Order?.firstName || order.firstName || 'N/A'} {order.Order?.lastName || order.lastName || ''}
                      </div>
                             <div className="text-sm text-muted-foreground">
                               {order.Order?.phoneNumber || order.phoneNumber || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                            {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                                                         {order.createdAt ? formatDate(order.createdAt) : 'N/A'}
                    </TableCell>
                          <TableCell className="text-right">
                            {formatPrice(order.totalPrice)}
                    </TableCell>
                  </TableRow>
                      ))}
                </TableBody>
              </Table>
                ) : (
                  <div className="flex justify-center items-center h-32 text-muted-foreground">
                    No orders found
                  </div>
                )}
            </CardContent>
          </Card>

            {/* Quick Actions & Stats */}
            <Card className="bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-950/50 dark:to-blue-900/30 border-indigo-200 dark:border-indigo-800">
            <CardHeader>
                <CardTitle className="text-indigo-800 dark:text-indigo-200">Quick Actions</CardTitle>
            </CardHeader>
              <CardContent className="grid gap-4">
                <Button asChild className="w-full justify-start bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
                  <Link href="/products">
                    <Package2 className="mr-2 h-4 w-4" />
                    Add New Product
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-600 dark:text-indigo-300 dark:hover:bg-indigo-900/30">
                  <Link href="/orders">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    View All Orders
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-600 dark:text-indigo-300 dark:hover:bg-indigo-900/30">
                  <Link href="/userTable">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Customers
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-600 dark:text-indigo-300 dark:hover:bg-indigo-900/30">
                  <Link href="/category">
                    <Star className="mr-2 h-4 w-4" />
                    Manage Categories
                  </Link>
                </Button>
            </CardContent>
          </Card>
        </div>


      </main>
    </div>
    </AdminLayout>
  );
}
