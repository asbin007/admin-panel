"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
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
  type Message,
  type Chat
} from "../store/chatSlice";
import { socket } from "../app/app";
import { 
  Send, 
  X, 
  MessageCircle, 
  Minimize2, 
  Maximize2, 
  Search,
  Check,
  CheckCheck,
  Paperclip
} from "lucide-react";
import toast from "react-hot-toast";

export default function SimpleChatWidget() {
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
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  
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
    if (user?.[0]?.id) {
      dispatch(fetchAllChats());
    }
  }, [dispatch, user?.[0]?.id]);

  // WebSocket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      dispatch(addMessage(message));
      dispatch(updateChatLastMessage({ chatId: message.chatId, message }));
      
      // Show notification if chat is not open or minimized
      if (!isOpen || isMinimized) {
        toast.success(`New message from ${message.Sender?.username || 'Customer'}`, {
          duration: 3000,
        });
      }
    };

    const handleTyping = ({ chatId, userId }: { chatId: string; userId: string }) => {
      const currentUserId = user?.[0]?.id;
      if (currentChat?.id === chatId && userId !== currentUserId) {
        dispatch(setTyping({ isTyping: true, userId }));
      }
    };

    const handleStopTyping = ({ chatId, userId }: { chatId: string; userId: string }) => {
      const currentUserId = user?.[0]?.id;
      if (currentChat?.id === chatId && userId !== currentUserId) {
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
  }, [dispatch, currentChat?.id, user?.[0]?.id, isOpen, isMinimized]);

  const handleSelectChat = async (chat: Chat) => {
    dispatch(setCurrentChat(chat));
    dispatch(fetchChatMessages({ chatId: chat.id }));
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
      const currentUserId = user?.[0]?.id;
      socket.emit("typing", {
        chatId: currentChat.id, 
        userId: currentUserId 
      });
        
      setTimeout(() => {
        socket.emit("stopTyping", { 
          chatId: currentChat.id, 
          userId: currentUserId 
        });
      }, 2000);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredChats = chats.filter(chat => 
    chat.Customer?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show chat widget for all users
  if (!user?.[0]?.id) {
    return null;
  }

  if (!isOpen) {
    return (
      <div 
        className="fixed z-[99999] right-5 bottom-5"
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          zIndex: 99999
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl shadow-2xl border-2 border-blue-500 flex items-center justify-center transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-3 h-3 bg-green-400 rounded-full absolute -top-1 -right-1 animate-pulse"></div>
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium">Customer Support</span>
          </div>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div 
      className="fixed z-[99999] right-5 bottom-5"
      style={{
        position: 'fixed',
        right: '20px',
        bottom: '20px',
        zIndex: 99999
      }}
    >
      <div className={`bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 ${
        isMinimized ? 'w-72 h-16' : 'w-96 h-[600px] max-h-[80vh]'
      }`}>
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-3 h-3 bg-green-400 rounded-full absolute -top-1 -right-1 animate-pulse"></div>
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Customer Support</h3>
                <p className="text-xs text-blue-100">
                  {currentChat ? `Chatting with ${currentChat.Customer?.username}` : 'Select a conversation'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 text-white hover:bg-blue-500 rounded-lg transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-white hover:bg-red-500 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex h-[520px]">
            {/* Chat List Sidebar */}
            <div className="w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col">
              {/* Search */}
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Chat List */}
              <div className="flex-1 overflow-y-auto">
                {status === 'loading' ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="text-center p-4 text-gray-500">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No conversations</p>
                  </div>
                ) : (
                  filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => handleSelectChat(chat)}
                      className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors ${
                        currentChat?.id === chat.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                          {chat.Customer?.username?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold text-gray-900 truncate">
                              {chat.Customer?.username || 'Customer'}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {chat.lastMessageAt ? formatTime(chat.lastMessageAt) : ''}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 truncate">
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
                  <div className="bg-white border-b border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                          {currentChat.Customer?.username?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold text-gray-900">
                            {currentChat.Customer?.username || 'Customer'}
                          </h2>
                          <p className="text-xs text-gray-600">
                            {currentChat.Customer?.email || 'customer@example.com'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 bg-gray-50 space-y-2">
                    {status === 'loading' ? (
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (!messages || messages.length === 0) ? (
                      <div className="text-center text-gray-400 py-4">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No messages yet</p>
                        <p className="text-xs">Start the conversation!</p>
                      </div>
                    ) : (
                      (messages || []).map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.senderId === user?.[0]?.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs ${
                              msg.senderId === user?.[0]?.id
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
                                {msg.senderId === user?.[0]?.id && (
                                  <>
                                    <Check className="w-2 h-2" />
                                    {msg.isRead && <CheckCheck className="w-2 h-2 text-blue-400" />}
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
                        <div className="max-w-[75%] px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 text-xs">
                          <div className="flex items-center space-x-1">
                            <div className="flex space-x-1">
                              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
                    <div className="p-3 bg-gray-50 border-t border-gray-200">
                      <div className="relative max-w-[150px]">
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
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Input */}
                  <div className="p-3 border-t border-gray-100 bg-white">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value);
                          handleTyping();
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                        placeholder="Type your message..."
                      />
                      
                      <button
                        onClick={handleSendMessage}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-sm"
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
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <h2 className="text-sm font-semibold text-gray-900 mb-1">Select a conversation</h2>
                    <p className="text-xs text-gray-600">Choose a chat from the sidebar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
