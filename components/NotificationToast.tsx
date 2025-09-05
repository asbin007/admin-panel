"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NotificationToastProps {
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
  onClose: () => void;
  onOpenChat: () => void;
}

export default function NotificationToast({ 
  message, 
  customerName, 
  onClose, 
  onOpenChat 
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show notification after a small delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleOpenChat = () => {
    setIsVisible(false);
    setTimeout(() => {
      onOpenChat();
    }, 300);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`fixed right-4 z-50 transition-all duration-300 transform ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-4 w-80 max-w-sm backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                New Message
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatTime(message.createdAt)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Customer Info */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
              {customerName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-slate-900 dark:text-white text-sm">
              {customerName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {message.Sender?.username || "Customer"}
            </p>
          </div>
        </div>

        {/* Message Preview */}
        <div className="mb-4">
          <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
            {message.content}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleOpenChat}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm py-2"
          >
            Open Chat
          </Button>
          <Button
            variant="outline"
            onClick={handleClose}
            className="text-sm py-2 border-slate-200 dark:border-slate-600"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
} 