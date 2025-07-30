"use client";

import { useEffect, useState, useRef } from "react";
import { Send, MessageCircle, User, Search, Image, MapPin, Paperclip, X, Clock, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminLayout from "../adminLayout/adminLayout";
import { socket } from "@/app/app";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setUnreadCount } from "@/store/chatSlice";
import NotificationToast from "@/components/NotificationToast";

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  chatId: string;
  createdAt: string;
  read: boolean;
  type?: 'text' | 'image' | 'location';
  imageUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  Sender?: {
    id: string;
    username: string;
    role: string;
  };
}

interface Chat {
  id: string;
  customerId: string;
  adminId: string;
  createdAt: string;
  updatedAt: string;
  Customer?: {
    id: string;
    username: string;
    email: string;
  };
  Admin?: {
    id: string;
    username: string;
    email: string;
  };
  Messages?: Message[];
  unreadCount?: number;
}

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: Message;
    customerName: string;
    chatId: string;
  }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAppSelector((store) => store.auth);
  const dispatch = useAppDispatch();

  // Notification functions
  const addNotification = (message: Message, customerName: string, chatId: string) => {
    const notificationId = Date.now().toString();
    setNotifications(prev => [...prev, {
      id: notificationId,
      message,
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
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      selectChat(chat);
      // Navigate to chat page if not already there
      if (typeof window !== 'undefined') {
        window.location.href = '/chat';
      }
    }
  };

  // Debug user object on component mount
  useEffect(() => {
    console.log("=== CHAT PAGE USER DEBUG ===");
    console.log("User from store:", user);
    console.log("User array length:", user?.length);
    console.log("First user:", user?.[0]);
    console.log("User ID:", user?.[0]?.id);
    console.log("User token:", user?.[0]?.token);
    console.log("===========================");
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Calculate and update unread count
  useEffect(() => {
    const totalUnread = chats.reduce((total, chat) => {
      return total + (chat.unreadCount || 0);
    }, 0);
    dispatch(setUnreadCount(totalUnread));
  }, [chats, dispatch]);

  useEffect(() => {
    // Fetch admin chats on component mount
    fetchAdminChats();

    // Listen for new messages
    socket.on("receiveMessage", (message: Message) => {
      if (selectedChat && message.chatId === selectedChat.id) {
        setMessages(prev => [...prev, message]);
      } else {
        // Show notification for new message from other chats
        const chat = chats.find(c => c.id === message.chatId);
        if (chat && message.senderId !== user?.[0]?.id) {
          addNotification(
            message, 
            chat.Customer?.username || "Customer", 
            message.chatId
          );
        }
      }
      // Update chat list to show new message
      updateChatList();
    });

    // Listen for typing indicators
    socket.on("typing", ({ chatId, userId }: { chatId: string; userId: string }) => {
      if (selectedChat && chatId === selectedChat.id) {
        setTypingUsers(prev => [...prev.filter(id => id !== userId), userId]);
      }
    });

    socket.on("stopTyping", ({ chatId, userId }: { chatId: string; userId: string }) => {
      if (selectedChat && chatId === selectedChat.id) {
        setTypingUsers(prev => prev.filter(id => id !== userId));
      }
    });

    // Listen for new message notifications
    socket.on("newMessageNotification", ({ chatId, message, sender }: { chatId: string; message: Message; sender: any }) => {
      console.log("New message notification:", { chatId, sender });
      
      // Show notification for new message
      const chat = chats.find(c => c.id === chatId);
      if (chat && message.senderId !== user?.[0]?.id && (!selectedChat || selectedChat.id !== chatId)) {
        addNotification(
          message, 
          chat.Customer?.username || "Customer", 
          chatId
        );
      }
      
      updateChatList();
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("newMessageNotification");
    };
  }, [selectedChat]);

  const fetchAdminChats = async () => {
    try {
      const { APIS } = await import("@/globals/http");
      
      const response = await APIS.get("/chats/all");
      
      if (response.status === 200) {
        console.log("✅ Chats fetched successfully:", response.data);
        setChats(response.data.data || []);
      } else {
        console.error("Error fetching admin chats:", response.status);
        // Use mock data if API fails
        setMockChats();
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
      // Use mock data if network error
      setMockChats();
    }
  };

  const setMockChats = () => {
    const mockChats: Chat[] = [
      {
        id: "1",
        customerId: "customer1",
        adminId: user?.id || "admin1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        Customer: {
          id: "customer1",
          username: "John Doe",
          email: "john@example.com"
        },
        Admin: {
          id: user?.id || "admin1",
          username: user?.username || "Admin",
          email: user?.email || "admin@shoemart.com"
        },
        Messages: [
          {
            id: "msg1",
            content: "Hello, I need help with my order",
            senderId: "customer1",
            receiverId: user?.id || "admin1",
            chatId: "1",
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            read: true
          },
          {
            id: "msg2",
            content: "Hi! I'd be happy to help. What's your order number?",
            senderId: user?.id || "admin1",
            receiverId: "customer1",
            chatId: "1",
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            read: true
          }
        ],
        unreadCount: 0
      },
      {
        id: "2",
        customerId: "customer2",
        adminId: user?.id || "admin1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        Customer: {
          id: "customer2",
          username: "Jane Smith",
          email: "jane@example.com"
        },
        Admin: {
          id: user?.id || "admin1",
          username: user?.username || "Admin",
          email: user?.email || "admin@shoemart.com"
        },
        Messages: [
          {
            id: "msg3",
            content: "When will my shoes arrive?",
            senderId: "customer2",
            receiverId: user?.id || "admin1",
            chatId: "2",
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            read: false
          }
        ],
        unreadCount: 1
      }
    ];
    
    setChats(mockChats);
  };

  const updateChatList = async () => {
    await fetchAdminChats();
  };

  const selectChat = async (chat: Chat) => {
    setSelectedChat(chat);
    
    try {
      const { APIS } = await import("@/globals/http");
      
      const response = await APIS.get(`/chats/${chat.id}/messages`);
      
      if (response.status === 200) {
        const chatMessages = response.data.data || [];
        
        // Debug messages
        console.log("Chat messages loaded:", chatMessages);
        chatMessages.forEach((msg: Message, index: number) => {
          console.log(`Message ${index}:`, { 
            type: msg.type, 
            imageUrl: msg.imageUrl, 
            content: msg.content,
            isImage: isImageMessage(msg)
          });
        });
        
        setMessages(chatMessages);
        
        // Join chat room
        socket.emit("joinChat", chat.id);
        
        // Mark messages as read
        socket.emit("markAsRead", { chatId: chat.id });
        
        // Update chat unread count to 0
        setChats(prev => prev.map(c => 
          c.id === chat.id ? { ...c, unreadCount: 0 } : c
        ));
      } else {
        console.error("Error fetching messages:", response.status);
        // Use mock messages if API fails
        const mockMessages = chat.Messages || [];
        setMessages(mockMessages);
        setChats(prev => prev.map(c => 
          c.id === chat.id ? { ...c, unreadCount: 0 } : c
        ));
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      // Use mock messages if network error
      const mockMessages = chat.Messages || [];
      setMessages(mockMessages);
      setChats(prev => prev.map(c => 
        c.id === chat.id ? { ...c, unreadCount: 0 } : c
      ));
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const token = localStorage.getItem("tokenauth") || 
                   document.cookie.split('; ').find(row => row.startsWith('tokenauth='))?.split('=')[1] ||
                   "";

      const messageData = {
        chatId: selectedChat.id,
        content: newMessage.trim(),
        // Remove senderId - backend will get it from req.user?.id
      };

      console.log("Sending message data:", messageData);
      console.log("User object:", user);
      console.log("User array length:", user?.length);
      console.log("First user:", user?.[0]);
      console.log("User ID:", user?.[0]?.id);
      console.log("Selected chat:", selectedChat);

      const { APIS } = await import("@/globals/http");
      
      const response = await APIS.post("/chats/send-message", messageData);

      if (response.status === 200 || response.status === 201) {
        const newMsg = response.data.data;
        
        // Add message to local state
        setMessages(prev => [...prev, newMsg]);
        
        // Update chat's last message
        setChats(prev => prev.map(chat => 
          chat.id === selectedChat.id 
            ? { ...chat, Messages: [...(chat.Messages || []), newMsg], updatedAt: new Date().toISOString() }
            : chat
        ));

        // Emit socket event for real-time updates
        socket.emit("sendMessage", {
          chatId: selectedChat.id,
          content: newMessage.trim(),
        });
      } else {
        console.error("Error sending message:", response.status);
        
        // Create mock message if API fails
        const mockMessage: Message = {
          id: Date.now().toString(),
          content: newMessage.trim(),
          senderId: user?.[0]?.id || "admin",
          receiverId: selectedChat.Customer?.id || "customer",
          chatId: selectedChat.id,
          createdAt: new Date().toISOString(),
          read: false,
          Sender: {
            id: user?.[0]?.id || "admin",
            username: user?.[0]?.username || "Admin",
            role: "admin"
          }
        };
        
        // Add message to local state
        setMessages(prev => [...prev, mockMessage]);
        
        // Update chat's last message
        setChats(prev => prev.map(chat => 
          chat.id === selectedChat.id 
            ? { ...chat, Messages: [...(chat.Messages || []), mockMessage], updatedAt: new Date().toISOString() }
            : chat
        ));
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Create mock message if network error
      const mockMessage: Message = {
        id: Date.now().toString(),
        content: newMessage.trim(),
        senderId: user?.[0]?.id || "admin",
        receiverId: selectedChat.Customer?.id || "customer",
        chatId: selectedChat.id,
        createdAt: new Date().toISOString(),
        read: false,
        Sender: {
          id: user?.[0]?.id || "admin",
          username: user?.[0]?.username || "Admin",
          role: "admin"
        }
      };
      
      // Add message to local state
      setMessages(prev => [...prev, mockMessage]);
      
      // Update chat's last message
      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { ...chat, Messages: [...(chat.Messages || []), mockMessage], updatedAt: new Date().toISOString() }
          : chat
      ));
    }
    
    setNewMessage("");
  };

  const handleTyping = () => {
    if (!selectedChat) return;
    
                  socket.emit("typing", {
        chatId: selectedChat.id,
        userId: user?.[0]?.id // This is fine for WebSocket as it's not the API
      });
        
        // Stop typing after 2 seconds
        setTimeout(() => {
          socket.emit("stopTyping", { 
            chatId: selectedChat.id, 
            userId: user?.[0]?.id 
          });
        }, 2000);
  };

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
        setShowImageDialog(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle location sharing
  const handleLocationShare = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          sendLocationMessage(latitude, longitude);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoading(false);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  // Send location message
  const sendLocationMessage = async (latitude: number, longitude: number) => {
    if (!selectedChat) return;

    try {
      const { APIS } = await import("@/globals/http");

      const response = await APIS.post("/chats/send-message", {
        chatId: selectedChat.id,
        content: `📍 Location shared`,
        type: 'location',
        location: { latitude, longitude },
      });

      if (response.status === 200 || response.status === 201) {
        const newMsg = response.data.data;
        setMessages(prev => [...prev, newMsg]);
        setChats(prev => prev.map(chat => 
          chat.id === selectedChat.id 
            ? { ...chat, Messages: [...(chat.Messages || []), newMsg], updatedAt: new Date().toISOString() }
            : chat
        ));
      }
    } catch (error) {
      console.error("Error sending location:", error);
    }
  };

  // Send image message
  const sendImageMessage = async () => {
    if (!selectedImage || !selectedChat) return;

    try {
      setIsLoading(true);
      const { APIS } = await import("@/globals/http");

      console.log("Sending image - User object:", user);
      console.log("Sending image - User ID:", user?.[0]?.id);
      console.log("Sending image - Selected chat:", selectedChat);
      console.log("Sending image - Selected image:", selectedImage);

      // Create FormData for image upload
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('chatId', selectedChat.id);
      formData.append('type', 'image');

      console.log("FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await APIS.post("/chats/send-message", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200 || response.status === 201) {
        const newMsg = response.data.data;
        console.log("Image sent successfully:", newMsg);
        console.log("New message type:", newMsg.type);
        console.log("New message imageUrl:", newMsg.imageUrl);
        setMessages(prev => [...prev, newMsg]);
        setChats(prev => prev.map(chat => 
          chat.id === selectedChat.id 
            ? { ...chat, Messages: [...(chat.Messages || []), newMsg], updatedAt: new Date().toISOString() }
            : chat
        ));
        
        // Clear image selection
        setSelectedImage(null);
        setImagePreview("");
        setShowImageDialog(false);
      } else {
        console.error("Error sending image:", response.status);
      }
    } catch (error) {
      console.error("Error sending image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear image selection
  const clearImageSelection = () => {
    setSelectedImage(null);
    setImagePreview("");
    setShowImageDialog(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.Customer?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.Customer?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  // Helper function to get proper image URL
  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '';
    
    // If it's already a full URL (including Cloudinary), return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it's a relative path, convert to full URL
    if (imageUrl.startsWith('/')) {
      return `http://localhost:5001${imageUrl}`;
    }
    
    // If it's just a filename, assume it's in uploads folder
    return `http://localhost:5001/uploads/${imageUrl}`;
  };

  // Helper function to get a fallback image URL
  const getFallbackImageUrl = () => {
    return '/placeholder-image.svg';
  };

  // Helper function to check if message is an image message
  const isImageMessage = (message: Message) => {
    // Check if type is 'image', content contains image indicator, or has imageUrl
    return message.type === 'image' || 
           (message.content && message.content.includes('📷 Image:')) ||
           (message.imageUrl && message.imageUrl.length > 0);
  };

  // Helper function to extract image filename from content
  const extractImageFilename = (content: string) => {
    const match = content.match(/📷 Image: (.+)/);
    return match ? match[1].trim() : null;
  };

  // Helper function to get sender name for a message
  const getSenderName = (message: Message) => {
    // If message has Sender info, use it
    if (message.Sender?.username) {
      return message.Sender.username;
    }
    
    // If it's the current admin user
    if (message.senderId === user?.[0]?.id) {
      return user?.[0]?.username || "Admin";
    }
    
    // If it's the customer in the selected chat
    if (message.senderId === selectedChat?.Customer?.id) {
      return selectedChat.Customer?.username || "Customer";
    }
    
    // If it's the admin in the selected chat
    if (message.senderId === selectedChat?.Admin?.id) {
      return selectedChat.Admin?.username || "Admin";
    }
    
    return "Unknown";
  };

  // Helper function to get sender avatar fallback
  const getSenderAvatarFallback = (message: Message) => {
    const senderName = getSenderName(message);
    return senderName.charAt(0).toUpperCase();
  };

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-100px)] flex bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        {/* Chat List */}
        <div className="w-80 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-r border-slate-200/50 dark:border-slate-700/50">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Customer Chats
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {filteredChats.length} active conversations
                  </p>
                </div>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/70 dark:bg-slate-700/70 border-slate-200/50 dark:border-slate-600/50 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            
            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {filteredChats.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="p-4 bg-slate-100/50 dark:bg-slate-700/50 rounded-2xl inline-block mb-4">
                    <MessageCircle className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-slate-600 dark:text-slate-300 font-medium mb-2">No chats found</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Start a conversation with your customers
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => selectChat(chat)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 mb-2 ${
                        selectedChat?.id === chat.id 
                          ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/50 dark:border-blue-700/50 shadow-lg" 
                          : "hover:bg-white/50 dark:hover:bg-slate-700/50 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-slate-800 shadow-lg">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                              {chat.Customer?.username?.charAt(0).toUpperCase() || "C"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {chat.Customer?.username || "Customer"}
                            </p>
                            {chat.unreadCount && chat.unreadCount > 0 && (
                              <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">
                                {chat.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 truncate mb-1">
                            {chat.Messages && chat.Messages.length > 0
                              ? chat.Messages[chat.Messages.length - 1].content
                              : "No messages yet"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {chat.updatedAt ? formatDate(chat.updatedAt) : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  {/* Customer Info */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-slate-800 shadow-lg">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {selectedChat.Customer?.username?.charAt(0).toUpperCase() || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {selectedChat.Customer?.username || "Customer"}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedChat.Customer?.email}
                      </p>
                    </div>
                  </div>
                  
                  {/* Admin Info */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Support Agent</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {user?.[0]?.username || selectedChat.Admin?.username || "Admin"}
                      </p>
                    </div>
                    <div className="relative">
                      <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-slate-800 shadow-lg">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold text-sm">
                          {(user?.[0]?.username || selectedChat.Admin?.username || "A").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.[0]?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div className="flex items-end gap-3 max-w-2xl">
                      {message.senderId !== user?.[0]?.id && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                            {getSenderAvatarFallback(message)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className="flex flex-col">
                        {/* Sender Name */}
                        {message.senderId !== user?.[0]?.id && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 ml-1">
                            {getSenderName(message)}
                          </p>
                        )}
                        
                        <div
                          className={`px-6 py-3 rounded-2xl shadow-lg max-w-md ${
                            message.senderId === user?.[0]?.id
                              ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                              : "bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-600/50"
                          }`}
                        >
                          {/* Message Content based on type */}
                          {isImageMessage(message) ? (
                            <div className="space-y-3">
                              <img 
                                src={getImageUrl(message.imageUrl || extractImageFilename(message.content) || '')} 
                                alt="Shared image" 
                                className="rounded-xl max-w-full h-auto cursor-pointer hover:opacity-90 transition-all duration-200 shadow-md"
                                onClick={() => window.open(getImageUrl(message.imageUrl || extractImageFilename(message.content) || ''), '_blank')}
                                onError={(e) => {
                                  console.warn("Image failed to load, showing fallback:", message.imageUrl || extractImageFilename(message.content));
                                  e.currentTarget.src = getFallbackImageUrl();
                                  e.currentTarget.onerror = null; // Prevent infinite loop
                                }}
                              />
                              {message.content && message.content.trim() && !message.content.includes('📷 Image:') && (
                                <p className="text-sm leading-relaxed">{message.content}</p>
                              )}
                            </div>
                          ) : message.type === 'location' && message.location ? (
                            <div className="space-y-3">
                              <div className="bg-slate-50/50 dark:bg-slate-600/50 rounded-xl p-4 border border-slate-200/50 dark:border-slate-500/50">
                                <div className="flex items-center gap-2 mb-3">
                                  <MapPin className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm font-semibold">📍 Location Shared</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 font-mono">
                                  {message.location.latitude.toFixed(6)}, {message.location.longitude.toFixed(6)}
                                </p>
                                <a
                                  href={`https://maps.google.com/?q=${message.location.latitude},${message.location.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors"
                                >
                                  <MapPin className="h-3 w-3" />
                                  View on Google Maps
                                </a>
                              </div>
                              {message.content && (
                                <p className="text-sm leading-relaxed">{message.content}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          )}
                          
                          {/* Message Footer */}
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/20 dark:border-slate-600/50">
                            <p className="text-xs opacity-70">
                              {formatTime(message.createdAt)}
                            </p>
                            {message.senderId === user?.[0]?.id && (
                              <div className="flex items-center gap-1">
                                {message.read ? (
                                  <CheckCheck className="h-3 w-3 text-blue-200" />
                                ) : (
                                  <Check className="h-3 w-3 opacity-50" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="flex items-end gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                          {selectedChat.Customer?.username?.charAt(0).toUpperCase() || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-white dark:bg-slate-700 px-6 py-3 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-600/50">
                        <div className="flex items-center gap-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {typingUsers.length === 1 ? "Customer is typing..." : "Someone is typing..."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-6 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <div className="flex gap-3">
                  {/* Attachment and Location Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="h-12 w-12 p-0 rounded-xl border-slate-200/50 dark:border-slate-600/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
                      title="Attach image"
                    >
                      <Image className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLocationShare}
                      disabled={isLoading}
                      className="h-12 w-12 p-0 rounded-xl border-slate-200/50 dark:border-slate-600/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
                      title="Share location"
                    >
                      <MapPin className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    </Button>
                  </div>
                  
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          sendMessage();
                        } else {
                          handleTyping();
                        }
                      }}
                      className="h-12 px-4 rounded-xl border-slate-200/50 dark:border-slate-600/50 bg-white/70 dark:bg-slate-700/70 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() && !selectedImage}
                    className="h-12 w-12 p-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Send className="h-5 w-5 text-white" />
                  </Button>
                </div>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                
                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-center gap-3 mt-4 p-3 bg-slate-50/50 dark:bg-slate-700/50 rounded-xl">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                      Sending message...
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl inline-block mb-6">
                  <MessageCircle className="h-16 w-16 text-blue-500 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Welcome to Chat
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                  Select a customer from the list to start a conversation and provide amazing support
                </p>
                <div className="mt-6 flex items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Real-time messaging</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>File sharing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Location sharing</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Image Preview Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {imagePreview && (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-64 object-cover rounded-lg"
                  onError={(e) => {
                    console.warn("Preview image failed to load");
                    e.currentTarget.src = getFallbackImageUrl();
                    e.currentTarget.onerror = null; // Prevent infinite loop
                  }}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={clearImageSelection}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Button 
                onClick={sendImageMessage} 
                disabled={!selectedImage || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Image
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={clearImageSelection}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Toasts */}
      {notifications.map((notification, index) => (
        <div key={notification.id} style={{ top: `${4 + (index * 5)}rem` }}>
          <NotificationToast
            message={notification.message}
            customerName={notification.customerName}
            onClose={() => removeNotification(notification.id)}
            onOpenChat={() => openChatFromNotification(notification.chatId)}
          />
        </div>
      ))}
    </AdminLayout>
  );
} 