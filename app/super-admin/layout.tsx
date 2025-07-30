"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Shield,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  UserPlus,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Check if user is super admin
      if (parsedUser.role !== 'super_admin') {
        router.push('/super-admin/login');
      }
    } else {
      router.push('/super-admin/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("tokenauth");
    localStorage.removeItem("userData");
    document.cookie = "tokenauth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/super-admin/login');
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/super-admin/dashboard",
      icon: BarChart3,
      current: pathname === "/super-admin/dashboard"
    },
    {
      name: "All Admins",
      href: "/super-admin/admins",
      icon: Users,
      current: pathname === "/super-admin/admins"
    },
    {
      name: "Create Admin",
      href: "/super-admin/admins/create",
      icon: UserPlus,
      current: pathname === "/super-admin/admins/create"
    },
    {
      name: "Pending Verification",
      href: "/super-admin/admins/pending",
      icon: RefreshCw,
      current: pathname === "/super-admin/admins/pending"
    },
    {
      name: "System Settings",
      href: "/super-admin/settings",
      icon: Settings,
      current: pathname === "/super-admin/settings"
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Left Side */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-r border-slate-200/50 dark:border-slate-700/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                  SHOEMART
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Super Admin
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    item.current
                      ? "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-700/50"
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-6 border-t border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                  {user.username?.charAt(0).toUpperCase() || "S"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {user.username || "Super Admin"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
                <Badge variant="secondary" className="mt-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  Super Admin
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                asChild
              >
                <Link href="/">
                  <Shield className="h-4 w-4 mr-2" />
                  Switch to Admin Panel
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Right Side */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between px-6 py-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                Super Admin
              </Badge>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 