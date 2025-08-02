"use client";
import Link from "next/link";
import {
  Bell,
  CircleUser,
  Home,
  Menu,
  Package,
  Package2,
  ShoppingCart,
  Star,
  Users,
  MessageCircle,
  Settings,
  LogOut,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import AdminSearch from "@/components/features/admin-search";
import { ModeToggle } from "@/components/ui/mode-toogle";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/authSlice";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { socket } from "@/app/app";
import NotificationToast from "@/components/NotificationToast";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { unreadCount } = useAppSelector((store) => store.chat);
  const [isChecking, setIsChecking] = useState(true);
  interface User {
    id: string;
    username: string;
    email: string;
    role: 'admin';
    isVerified?: boolean;
  }
  
  const [user, setUser] = useState<User | null>(null);
  interface Notification {
    id: string;
    message: {
      id: string;
      content: string;
      senderId: string;
      chatId: string;
      createdAt: string;
      Sender?: {
        id: string;
        username: string;
        role: string;
      };
    };
    customerName: string;
    chatId: string;
  }
  
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // useEffect(() => {
    
  //   const loggedIn= localStorage.getItem('tokenauth')
  //   if(!loggedIn){
  //     router.push('/user/login')

  //   }
  // }, []);
  
  useEffect(() => {
    console.log('AdminLayout: Checking authentication...');
    const token = Cookies.get("tokenauth");
    console.log('AdminLayout: Token exists:', !!token);
    
    if (!token) {
      console.log('AdminLayout: No token found, redirecting to login');
      router.push("/user/login");
      return;
    }
    
    // Load user data
    const userData = localStorage.getItem("userData");
    console.log('AdminLayout: User data exists:', !!userData);
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('AdminLayout: Parsed user data:', parsedUser);
        setUser(parsedUser);
        
        // Check if user has proper role and is verified
        if (parsedUser.role !== 'admin') {
          console.log('AdminLayout: Invalid role, redirecting to login');
          router.push("/user/login");
          return;
        }
        
        // Check if admin is verified
        if (!parsedUser.isVerified) {
          console.log('AdminLayout: Admin not verified, redirecting to login');
          router.push("/user/login");
          return;
        }
        
        console.log('AdminLayout: Authentication successful, user:', parsedUser.username);
      } catch (error) {
        console.error('AdminLayout: Error parsing user data:', error);
        router.push("/user/login");
        return;
      }
    } else {
      console.log('AdminLayout: No user data found, redirecting to login');
      router.push("/user/login");
      return;
    }
    
    setIsChecking(false);
  }, [router]);

  // Socket event listeners for notifications
  useEffect(() => {
    // Listen for new messages when not on chat page
    const handleNewMessage = (message: { chatId: string; message: string }) => {
      // Only show notification if not on chat page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/chat')) {
        addNotification(message.message, "Customer", message.chatId);
      }
    };

    const handleNewMessageNotification = ({ chatId, message }: { chatId: string; message: string }) => {
      // Only show notification if not on chat page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/chat')) {
        addNotification(message, "Customer", chatId);
      }
    };

    socket.on("receiveMessage", handleNewMessage);
    socket.on("newMessageNotification", handleNewMessageNotification);

    return () => {
      socket.off("receiveMessage", handleNewMessage);
      socket.off("newMessageNotification", handleNewMessageNotification);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/user/login");
  };

  // Notification functions
  const addNotification = (messageContent: string, customerName: string, chatId: string) => {
    const notificationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const messageObject = {
      id: notificationId,
      content: messageContent,
      senderId: 'customer',
      chatId: chatId,
      createdAt: new Date().toISOString(),
      Sender: {
        id: 'customer',
        username: customerName,
        role: 'customer'
      }
    };
    
    setNotifications(prev => [...prev, {
      id: notificationId,
      message: messageObject,
      customerName,
      chatId
    }]);

    // Auto remove notification after 10 seconds
    setTimeout(() => {
      removeNotification(notificationId);
    }, 10000);
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const openChatFromNotification = (chatId: string) => {
    router.push(`/chat?chatId=${chatId}`);
  };

  if(isChecking){
    return<div className="w-full h-screen flex  justify-center items-center">loading....</div>
  }
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Package2 className="h-6 w-6" />
              <span className="">shoeMart </span>
            </Link>
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/orders"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <ShoppingCart className="h-4 w-4" />
                Orders
                {/* <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  6
                </Badge> */}
              </Link>
              <Link
                href="/category "
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Package className="h-4 w-4" />
                Category
              </Link>
              <Link
                href="/products "
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Package className="h-4 w-4" />
                Products
              </Link>

              <Link
                href="/userTable"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Users className="h-4 w-4" />
                Customers
              </Link>
              <Link
                href="/reviews"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Star className="h-4 w-4" />
                Reviews
              </Link>
                             <Link
                 href="/chat"
                 className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
               >
                 <MessageCircle className="h-4 w-4" />
                 Chat
               </Link>
               <Link
                 href="/settings"
                 className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
               >
                 <Settings className="h-4 w-4" />
                 Settings
               </Link>

            </nav>
          </div>

        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
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
            <SheetContent side="left" className="flex flex-col">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Main navigation menu for the admin panel</SheetDescription>
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  <Package2 className="h-6 w-6" />
                  <span className="sr-only">Nike shoe</span>
                </Link>
                <Link
                  href="/"
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                  <Home className="h-5 w-5" />
                  Dashboard
                </Link>
                <Link
                  href={"/orders"}
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl bg-muted px-3 py-2 text-foreground hover:text-foreground"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Orders
                  <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                    6
                  </Badge>
                </Link>
                 <Link
                  href="/category"
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                  <Package className="h-5 w-5" />
                  Category
                </Link>
                <Link
                  href="/products"
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                  <Package className="h-5 w-5" />
                  Products
                </Link>
                <Link
                  href="/userTable"
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                  <Users className="h-5 w-5" />
                  Customers
                </Link>
                <Link
                  href="/reviews"
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                  <Star className="h-5 w-5" />
                  Reviews
                </Link>
                                 <Link
                   href="/chat"
                   className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                 >
                   <MessageCircle className="h-5 w-5" />
                   Chat
                 </Link>
                 <Link
                   href="/settings"
                   className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                 >
                   <Settings className="h-5 w-5" />
                   Settings
                 </Link>

              </nav>

            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <AdminSearch />
          </div>
          <ModeToggle />
          <Link href="/chat">
            <Button variant="outline" size="icon" className="relative">
              <MessageCircle className="h-5 w-5" />
              <span className="sr-only">Messages</span>
              {/* Unread message indicator */}
              {unreadCount > 0 && (
                <div className={`absolute -top-1 -right-1 bg-red-500 rounded-full animate-pulse flex items-center justify-center ${
                  unreadCount > 9 ? 'w-4 h-4' : 'w-3 h-3'
                }`}>
                  <span className="text-xs text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                </div>
              )}
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.username || "Admin"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || "admin@shoemart.com"}
                  </p>
                                     <Badge variant="secondary" className="w-fit mt-1">
                     Admin
                   </Badge>
                   <p className="text-xs text-muted-foreground">
                     Role: {user?.role || 'Unknown'}
                   </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              
              
              {/* Remove the unsafe "Always show switch to super admin for testing" section */}
              
                             <DropdownMenuItem asChild>
                 <Link href="/settings" className="flex items-center">
                   <Settings className="h-4 w-4 mr-2" />
                   Settings
                 </Link>
               </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageCircle className="h-4 w-4 mr-2" />
                Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>

      {/* Notification Toasts */}
      {notifications.map((notification, index) => (
        <div key={`notification-${notification.id}-${index}`} style={{ top: `${4 + (index * 5)}rem` }}>
          <NotificationToast
            message={notification.message}
            customerName={notification.customerName}
            onClose={() => removeNotification(notification.id)}
            onOpenChat={() => openChatFromNotification(notification.chatId)}
          />
        </div>
      ))}
    </div>
  );
}
