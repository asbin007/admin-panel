"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { 
  fetchAllChats, 
  fetchChatMessages, 
  sendMessage, 
  markMessagesAsRead,
  addMessage,
  setTyping,
  clearTyping,
  updateChatLastMessage,
  markChatAsRead,
  setCurrentChat,
  setMessages,
  type Message,
  type Chat
} from "../../store/chatSlice";
import { socket } from "../app";
import { 
  Send, 
  Image, 
  X, 
  MessageCircle, 
  Phone, 
  Video, 
  MoreVertical,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  Search,
  Filter,
  Users,
  Clock
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminChatPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { 
    chats = [], 
    currentChat, 
    messages = [], 
    status = 'idle', 
    error, 
    unreadCount = 0, 
    isTyping = false, 
    typingUsers = [] 
  } = useAppSelector((state) => state.chat);
  
  // Debug logging
  console.log('🔍 Chat Debug Info:');
  console.log('  - Messages count:', messages.length);
  console.log('  - Messages data:', messages);
  console.log('  - Current chat:', currentChat);
  console.log('  - Status:', status);
  
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch chats on mount
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchAllChats());
    }
  }, [dispatch, user?.id]);

  // WebSocket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      dispatch(addMessage(message));
      dispatch(updateChatLastMessage({ chatId: message.chatId, message }));
      
      // Show notification
      toast.success(`New message from ${message.Sender?.username || 'Customer'}`, {
        duration: 3000,
      });
    };

    const handleTyping = ({ chatId, userId }: { chatId: string; userId: string }) => {
      if (currentChat?.id === chatId && userId !== user?.id) {
        dispatch(setTyping({ isTyping: true, userId }));
      }
    };

    const handleStopTyping = ({ chatId, userId }: { chatId: string; userId: string }) => {
      if (currentChat?.id === chatId && userId !== user?.id) {
        dispatch(setTyping({ isTyping: false, userId }));
      }
    };

    socket.on("receiveMessage", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("receiveMessage", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [dispatch, currentChat?.id, user?.id]);

  const handleSelectChat = async (chat: Chat) => {
    console.log('🔍 Selecting chat:', chat.id);
    dispatch(setCurrentChat(chat));
    
    // Clear existing messages first
    dispatch(setMessages([]));
    
    // Fetch messages for the selected chat
    const result = await dispatch(fetchChatMessages({ chatId: chat.id }));
    console.log('🔍 Fetch messages result:', result);
    
    // Mark messages as read (this will fail gracefully if endpoint doesn't exist)
    dispatch(markMessagesAsRead(chat.id));
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedImage) return;
    if (!currentChat) return;

    try {
      const result = await dispatch(sendMessage({
        chatId: currentChat.id,
        content: message,
        messageType: selectedImage ? 'image' : 'text',
        image: selectedImage || undefined
      }));

      if (sendMessage.fulfilled.match(result)) {
        setMessage("");
        setSelectedImage(null);
        setImagePreview("");

        // Emit socket event for real-time updates
        socket.emit("sendMessage", {
          chatId: currentChat.id,
          content: message,
          messageType: selectedImage ? 'image' : 'text'
        });
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      toast.error("Please select an image file");
    }
  };

  const handleTyping = () => {
    if (currentChat) {
      socket.emit("typing", {
        chatId: currentChat.id, 
        userId: user?.id 
      });
        
      setTimeout(() => {
        socket.emit("stopTyping", { 
          chatId: currentChat.id, 
          userId: user?.id 
        });
      }, 2000);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
      return date.toLocaleDateString();
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.Customer?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );


    return (
    <div className="h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
            {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Customer Support</h1>
          <p className="text-sm text-gray-600">Manage customer conversations</p>
              </div>
              
              {/* Search */}
        <div className="p-4 border-b border-gray-200">
              <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
          {status === 'loading' ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center p-4 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
                </div>
              ) : (
            filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                onClick={() => handleSelectChat(chat)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  currentChat?.id === chat.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {chat.Customer?.username?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {chat.Customer?.username || 'Customer'}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {chat.lastMessageAt ? formatTime(chat.lastMessageAt) : ''}
                      </span>
                          </div>
                    <p className="text-sm text-gray-600 truncate">
                      {chat.lastMessage || 'No messages yet'}
                    </p>
                    {chat.unreadCount > 0 && (
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-blue-600 font-medium">
                          {chat.unreadCount} unread
                        </span>
                        </div>
                    )}
                      </div>
                    </div>
                </div>
            ))
              )}
          </div>
        </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentChat ? (
            <>
              {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {currentChat.Customer?.username?.charAt(0).toUpperCase() || 'C'}
                    </div>
                    <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {currentChat.Customer?.username || 'Customer'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {currentChat.Customer?.email || 'customer@example.com'}
                      </p>
                    </div>
                  </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
              {status === 'loading' ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (!messages || messages.length === 0) ? (
                <div className="text-center text-gray-400 py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-xs">Start the conversation!</p>
                  </div>
                ) : (
                (messages || []).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                        msg.senderId === user?.id
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-200 text-gray-800"
                      }`}
                    >
                      {msg.imageUrl && (
                        <div className="mb-2">
                          <img 
                            src={msg.imageUrl} 
                            alt="Message attachment" 
                            className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(msg.imageUrl, '_blank')}
                          />
                            </div>
                      )}
                      <div className="break-words">{msg.content}</div>
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="opacity-75">{formatTime(msg.createdAt)}</span>
                        <div className="flex items-center space-x-1">
                          {msg.senderId === user?.id && (
                            <>
                              <Check className="w-3 h-3" />
                              {msg.isRead && <CheckCheck className="w-3 h-3 text-blue-400" />}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
                )}
                
                {/* Typing indicator */}
              {isTyping && typingUsers.length > 0 && (
                  <div className="flex justify-start">
                  <div className="max-w-[75%] px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 text-sm">
                    <div className="flex items-center space-x-1">
                          <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                      <span className="ml-2">Customer is typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <div className="relative max-w-[200px]">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="rounded-lg max-w-full h-auto"
                  />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview("");
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <input
                  type="text"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                          handleTyping();
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  placeholder="Type your message..."
                />
                
                <button
                  onClick={handleSendMessage}
                  className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
                </div>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </>
          ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h2>
              <p className="text-gray-600">Choose a chat from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
