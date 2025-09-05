"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Send, MessageCircle, X, Minimize2, Maximize2, Image, MapPin, Check, CheckCheck } from "lucide-react";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Removed unused Card, Badge, Avatar imports
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { socket } from "@/app/app";

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

interface CustomerChatProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function CustomerChat({ isOpen, onToggle, onClose }: CustomerChatProps) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  // Removed unused isTyping state
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<{
    id: string;
    username: string;
    email: string;
    role: string;
  } | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const createNewChat = useCallback(async () => {
    try {
      // First get available admins
      const adminResponse = await fetch("http://localhost:5001/api/chats/admins", {
        headers: {
          Authorization: localStorage.getItem("tokenauth") || "",
        },
      });
      
      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        const admins = adminData.data || [];
        
        if (admins.length === 0) {
          alert("No admin users available. Please try again later.");
          return;
        }
        
        // Use the first available admin
        const admin = admins[0];
        
        // Create new chat with the admin
        const chatResponse = await fetch("http://localhost:5001/api/chats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: localStorage.getItem("tokenauth") || "",
          },
          body: JSON.stringify({
            adminId: admin.id,
          }),
        });
        
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          const newChat = chatData.data;
          setChat(newChat);
          await loadChatMessages(newChat.id);
        } else {
          alert("Unable to create chat. Please try again later.");
        }
      } else {
        alert("Unable to get admin users. Please try again later.");
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      alert("Unable to start chat at the moment. Please try again later.");
    }
  }, []);

  const initializeCustomerChat = useCallback(async () => {
    try {
      // First try to get existing chat
      const response = await fetch("http://localhost:5001/api/chat/all", {
        headers: {
          Authorization: localStorage.getItem("tokenauth") || "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const chats = data.data || [];
        
        if (chats.length > 0) {
          // Use the first existing chat
          const existingChat = chats[0];
          setChat(existingChat);
          await loadChatMessages(existingChat.id);
        } else {
          // Create new chat if none exists
          await createNewChat();
        }
      }
    } catch (error) {
      console.error("Error initializing chat:", error);
    }
  }, [createNewChat]);

  // Load user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Initialize chat for customer
    initializeCustomerChat();

    // Listen for new messages
    socket.on("receiveMessage", (message: Message) => {
      if (chat && message.chatId === chat.id) {
        setMessages(prev => [...prev, message]);
      }
    });

    // Listen for typing indicators
    socket.on("typing", ({ chatId, userId }: { chatId: string; userId: string }) => {
      if (chat && chatId === chat.id && userId !== user?.id) {
        setTypingUsers(prev => [...prev.filter(id => id !== userId), userId]);
      }
    });

    socket.on("stopTyping", ({ chatId, userId }: { chatId: string; userId: string }) => {
      if (chat && chatId === chat.id) {
        setTypingUsers(prev => prev.filter(id => id !== userId));
      }
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [chat, initializeCustomerChat, user?.id]);

  const loadChatMessages = async (chatId: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/chats/${chatId}/messages`, {
        headers: {
          Authorization: localStorage.getItem("tokenauth") || "",
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
        
        // Join chat room
        socket.emit("joinChat", chatId);
        
        // Mark messages as read
        socket.emit("markAsRead", { chatId });
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket.connected || !user) {
      return;
    }

    // Initialize chat for customer
    initializeCustomerChat();

    // Listen for new messages
    socket.on("receiveMessage", (message: Message) => {
      if (chat && message.chatId === chat.id) {
        setMessages(prev => [...prev, message]);
      }
    });

    // Listen for typing indicators
    socket.on("typing", ({ chatId, userId }: { chatId: string; userId: string }) => {
      if (chat && chatId === chat.id && userId !== user.id) {
        setTypingUsers(prev => [...prev.filter(id => id !== userId), userId]);
      }
    });

    socket.on("stopTyping", ({ chatId, userId }: { chatId: string; userId: string }) => {
      if (chat && chatId === chat.id) {
        setTypingUsers(prev => prev.filter(id => id !== userId));
      }
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [chat, initializeCustomerChat, user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !chat) return;

    try {
      const messageData = {
        chatId: chat.id,
        content: newMessage.trim(),
        // Remove senderId - backend will get it from req.user?.id
      };

      console.log("Customer sending message data:", messageData);
      console.log("Customer user object:", user);
      console.log("Customer chat:", chat);

      const response = await fetch("http://localhost:5001/api/chats/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("tokenauth") || "",
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        const data = await response.json();
        const newMsg = data.data;
        
        // Add message to local state
        setMessages(prev => [...prev, newMsg]);
        
        // Emit socket event for real-time updates
        socket.emit("sendMessage", {
          chatId: chat.id,
          content: newMessage.trim(),
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
    
    setNewMessage("");
  };

  const handleTyping = () => {
    if (!chat) return;
    
    socket.emit("typing", { 
      chatId: chat.id, 
      userId: user?.id 
    });
    
    // Stop typing after 2 seconds
    setTimeout(() => {
      socket.emit("stopTyping", { 
        chatId: chat.id, 
        userId: user?.id 
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
    if (!chat) return;

    try {
      const token = localStorage.getItem("tokenauth") || 
                   document.cookie.split('; ').find(row => row.startsWith('tokenauth='))?.split('=')[1] ||
                   "";

      const response = await fetch("http://localhost:5001/api/chats/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          chatId: chat.id,
          content: `📍 Location shared`,
          type: 'location',
          location: { latitude, longitude },
          // Remove senderId - backend will get it from req.user?.id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newMsg = data.data;
        setMessages(prev => [...prev, newMsg]);
      }
    } catch (error) {
      console.error("Error sending location:", error);
    }
  };

  // Send image message
  const sendImageMessage = async () => {
    if (!selectedImage || !chat) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem("tokenauth") || 
                   document.cookie.split('; ').find(row => row.startsWith('tokenauth='))?.split('=')[1] ||
                   "";

      // Create FormData for image upload
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('chatId', chat.id);
      formData.append('type', 'image');
      // Remove senderId - backend will get it from req.user?.id

      const response = await fetch("http://localhost:5001/api/chats/send-message", {
        method: "POST",
        headers: {
          Authorization: token,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const newMsg = data.data;
        setMessages(prev => [...prev, newMsg]);
        
        // Clear image selection
        setSelectedImage(null);
        setImagePreview("");
        setShowImageDialog(false);
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggle}
          className="rounded-full h-14 w-14 p-0 shadow-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-110"
          size="icon"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Customer Support</h3>
                <p className="text-blue-100 text-sm">We&apos;re here to help!</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-700 dark:to-slate-800">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl inline-block mb-4">
                    <MessageCircle className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-slate-700 dark:text-slate-200 font-medium mb-2">Welcome!</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Start a conversation with our support team
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div className="flex items-end gap-2 max-w-80">
                      {message.senderId !== user?.id && (
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          S
                        </div>
                      )}
                      
                      <div
                        className={`px-4 py-3 rounded-2xl shadow-lg max-w-64 ${
                          message.senderId === user?.id
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                            : "bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-600/50"
                        }`}
                      >
                        {/* Message Content based on type */}
                        {message.type === 'image' && message.imageUrl ? (
                          <div className="space-y-2">
                            <NextImage 
                              src={message.imageUrl} 
                              alt="Shared image" 
                              width={400}
                              height={300}
                              className="rounded-xl max-w-full h-auto cursor-pointer hover:opacity-90 transition-all duration-200 shadow-md"
                              onClick={() => window.open(message.imageUrl, '_blank')}
                            />
                            {message.content && (
                              <p className="text-sm leading-relaxed">{message.content}</p>
                            )}
                          </div>
                        ) : message.type === 'location' && message.location ? (
                          <div className="space-y-2">
                            <div className="bg-slate-50/50 dark:bg-slate-600/50 rounded-xl p-3 border border-slate-200/50 dark:border-slate-500/50">
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-semibold">📍 Location Shared</span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 font-mono">
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
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20 dark:border-slate-600/50">
                          <p className="text-xs opacity-70">
                            {formatTime(message.createdAt)}
                          </p>
                          {message.senderId === user?.id && (
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
                ))
              )}
              
              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="flex items-end gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      S
                    </div>
                    <div className="bg-white dark:bg-slate-700 px-4 py-3 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-600/50">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          Admin is typing...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="flex gap-2">
                {/* Attachment and Location Buttons */}
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="h-10 w-10 p-0 rounded-xl border-slate-200/50 dark:border-slate-600/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
                    title="Attach image"
                  >
                    <Image className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLocationShare}
                    disabled={isLoading}
                    className="h-10 w-10 p-0 rounded-xl border-slate-200/50 dark:border-slate-600/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
                    title="Share location"
                  >
                    <MapPin className="h-4 w-4 text-slate-600 dark:text-slate-300" />
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
                    className="h-10 px-4 rounded-xl border-slate-200/50 dark:border-slate-600/50 bg-slate-50/50 dark:bg-slate-700/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    disabled={isLoading}
                  />
                </div>
                
                <Button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim() && !selectedImage}
                  className="h-10 w-10 p-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Send className="h-4 w-4 text-white" />
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
                <div className="flex items-center gap-3 mt-3 p-3 bg-slate-50/50 dark:bg-slate-700/50 rounded-xl">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                    Sending message...
                  </span>
                </div>
              )}
            </div>
          </>
        )}
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
                <NextImage 
                  src={imagePreview} 
                  alt="Preview" 
                  width={400}
                  height={256}
                  className="w-full h-64 object-cover rounded-lg"
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
    </div>
  );
} 