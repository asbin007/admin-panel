"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle, XCircle, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Notification {
  id: string;
  type: 'admin_approval' | 'admin_rejected' | 'new_admin_request';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  adminId?: string;
  adminName?: string;
}

interface AdminApprovalNotificationProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onApproveAdmin?: (adminId: string) => void;
  onRejectAdmin?: (adminId: string) => void;
}

export default function AdminApprovalNotification({
  notifications,
  onMarkAsRead,
  onApproveAdmin,
  onRejectAdmin
}: AdminApprovalNotificationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'admin_approval':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'admin_rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'new_admin_request':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 z-50 bg-white dark:bg-slate-800 shadow-lg border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Admin Notifications</span>
              <Badge variant="secondary">
                {unreadCount} unread
              </Badge>
            </CardTitle>
            <CardDescription>
              Recent admin approval activities
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => !notification.read && onMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${
                              !notification.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                            }`}>
                              {notification.title}
                            </p>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {notification.message}
                          </p>
                          
                          {/* Action buttons for pending approvals */}
                          {notification.type === 'new_admin_request' && notification.adminId && (
                            <div className="flex space-x-2 mt-2">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onApproveAdmin?.(notification.adminId!);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-6"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRejectAdmin?.(notification.adminId!);
                                }}
                                className="text-xs px-2 py-1 h-6"
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Notification hook for managing notifications
export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification
  };
}
