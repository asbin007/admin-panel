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
  Paperclip,
  CircleDot,
  MoreVertical
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
  const [localUnreadCount, setLocalUnreadCount] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Debug: Log current chat and messages state
  useEffect(() => {
    if (currentChat) {
      console.log('💬 Current Chat:', currentChat.id);
      console.log('📨 Messages count:', messages?.length || 0);
      console.log('📨 Messages:', messages);
      console.log('🔄 Status:', status);
    }
  }, [currentChat, messages, status]);

  // Fetch chats on mount and periodically
  useEffect(() => {
    if (user?.id) {
      console.log('🔍 Fetching chats for user:', user.id);
      dispatch(fetchAllChats()).then((result) => {
        console.log('✅ Chats loaded:', result);
      }).catch((error) => {
        console.warn('⚠️ Chat feature not available:', error);
      });
    }
  }, [dispatch, user?.id]);

  // Debug: Log chats when they change
  useEffect(() => {
    if (chats.length > 0) {
      console.log('📊 Total chats:', chats.length);
      chats.forEach(chat => {
        console.log(`Chat ${chat.id}:`, {
          customer: chat.Customer?.username,
          lastMessage: chat.lastMessage,
          unreadCount: chat.unreadCount,
          lastMessageAt: chat.lastMessageAt
        });
      });
    }
  }, [chats]);

  // Refresh chats periodically
  useEffect(() => {
    if (user?.id && isOpen) {
      const interval = setInterval(() => {
        dispatch(fetchAllChats());
      }, 30000); // Refresh every 30 seconds when chat is open
      
      return () => clearInterval(interval);
    }
  }, [dispatch, user?.id, isOpen]);

  // WebSocket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      dispatch(addMessage(message));
      dispatch(updateChatLastMessage({ chatId: message.chatId, message }));
      
      // Track unread count when widget is closed or minimized
      if (!isOpen || isMinimized) {
        setLocalUnreadCount(prev => prev + 1);
      }
      
      // Show notification if chat is not open or minimized
      if (!isOpen || isMinimized) {
        toast.success(`New message from ${message.Sender?.username || 'Customer'}`, {
          duration: 3000,
        });
      }
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
  }, [dispatch, currentChat?.id, user?.id, isOpen, isMinimized]);

  // Clear unread count when widget is opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      console.log('📱 Widget opened - clearing unread notifications');
      setLocalUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  // Sync with global unread count from store
  useEffect(() => {
    if (unreadCount > 0 && (!isOpen || isMinimized)) {
      setLocalUnreadCount(unreadCount);
    }
  }, [unreadCount, isOpen, isMinimized]);

  const handleOpenWidget = () => {
    console.log('📱 Opening widget and clearing notifications');
    setLocalUnreadCount(0);
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleSelectChat = async (chat: Chat) => {
    console.log('🔍 Selecting chat:', chat.id);
    console.log('📋 Chat data:', chat);
    
    // Set current chat first
    dispatch(setCurrentChat(chat));
    
    // Fetch messages
    try {
      const result = await dispatch(fetchChatMessages({ chatId: chat.id }));
      console.log('✅ Messages fetched:', result);
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
    }
    
    // Mark as read
    dispatch(markMessagesAsRead(chat.id));
    
    console.log('✅ Chat selected and messages loading initiated');
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
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredChats = chats.filter(chat => 
    chat.Customer?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show chat widget for all users
  if (!user?.id) {
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
          onClick={handleOpenWidget}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-4 rounded-3xl shadow-[0_8px_24px_rgba(59,130,246,0.5)] hover:shadow-[0_12px_32px_rgba(59,130,246,0.6)] flex items-center justify-center transition-all duration-300 transform hover:scale-105 group"
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse shadow-lg"></div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 group-hover:bg-white/30 transition-all">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold">Customer Support</span>
              <span className="text-xs text-blue-100 font-medium">Online now</span>
            </div>
          </div>
          {(localUnreadCount > 0 || unreadCount > 0) && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-bounce">
              {localUnreadCount > 0 ? (localUnreadCount > 9 ? '9+' : localUnreadCount) : (unreadCount > 9 ? '9+' : unreadCount)}
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
      <div className={`bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-gray-100 overflow-hidden transition-all duration-300 ${
        isMinimized ? 'w-72 h-16' : 'w-96 h-[600px] max-h-[80vh]'
      }`}>
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full animate-pulse shadow-md"></div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2.5">
                  <MessageCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate">Customer Support</h3>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-blue-100 truncate">
                    {currentChat ? `${currentChat.Customer?.username}` : 'Select a conversation'}
                  </p>
                  {currentChat && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-green-200 font-medium">
                      <CircleDot className="w-3 h-3" />
                      Online
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex h-[520px]">
            {/* Chat List Sidebar */}
            <div className="w-1/3 bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 flex flex-col">
              {/* Search */}
              <div className="p-3 border-b border-gray-200 bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search customers..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all"
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
                      className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-white transition-all duration-200 group ${
                        currentChat?.id === chat.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative flex-shrink-0">
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-md animate-pulse"></div>
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                            {chat.Customer?.username?.charAt(0).toUpperCase() || 'C'}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {chat.Customer?.username || 'Customer'}
                            </h3>
                            <span className="text-[10px] text-gray-500 flex-shrink-0 ml-2">
                              {chat.lastMessageAt ? formatTime(chat.lastMessageAt) : ''}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs truncate flex-1 ${
                              chat.lastMessage 
                                ? 'text-gray-800 font-medium' 
                                : chat.unreadCount > 0 
                                  ? 'text-blue-600 italic' 
                                  : 'text-gray-500 italic'
                            }`}>
                              {chat.lastMessage || (chat.unreadCount > 0 ? `${chat.unreadCount} unread message${chat.unreadCount > 1 ? 's' : ''}` : 'Start conversation...')}
                            </p>
                            {chat.unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center flex-shrink-0 shadow-md animate-pulse">
                                {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
              {currentChat ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative flex-shrink-0">
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-md animate-pulse"></div>
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                            {currentChat.Customer?.username?.charAt(0).toUpperCase() || 'C'}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-gray-900 truncate">
                              {currentChat.Customer?.username || 'Customer'}
                            </h2>
                            <span className="inline-flex items-center gap-1 text-[10px] text-green-600 font-medium">
                              <CircleDot className="w-3 h-3" />
                              Active now
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            {currentChat.Customer?.email || 'customer@example.com'}
                          </p>
                        </div>
                      </div>
                      <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors" title="More options">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white via-gray-50 to-white space-y-3">
                    {status === 'loading' ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                        <p className="text-sm text-gray-600">Loading messages...</p>
                      </div>
                    ) : (!messages || messages.length === 0) ? (
                      <div className="text-center text-gray-400 py-12">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-3">
                          <MessageCircle className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">No messages in this chat</p>
                        <p className="text-xs text-gray-600">Start the conversation with {currentChat?.Customer?.username || 'your customer'}!</p>
                        {currentChat?.lastMessage && (
                          <div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg max-w-xs mx-auto">
                            <p className="text-xs font-medium text-blue-900 mb-1">Last activity:</p>
                            <p className="text-xs text-blue-700">{currentChat.lastMessage}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      [...(messages || [])]
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map((msg) => {
                          const isUnread = !msg.isRead && msg.senderId !== user?.id;
                          
                          return (
                            <div
                              key={msg.id}
                              className={`flex items-end gap-2 ${msg.senderId === user?.id ? "justify-end" : "justify-start"} ${isUnread ? 'opacity-100' : ''}`}
                            >
                              {msg.senderId !== user?.id && (
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-[10px] flex-shrink-0">
                                  {msg.Sender?.username?.charAt(0).toUpperCase() || 'C'}
                                </div>
                              )}
                              <div
                              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                                msg.senderId === user?.id
                                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md"
                                  : isUnread
                                  ? "bg-white border-2 border-blue-400 text-gray-800 rounded-bl-md shadow-md"
                                  : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
                              }`}
                              >
                                {msg.imageUrl && (
                                  <div className="mb-2 -mx-1">
                                    <img 
                                      src={msg.imageUrl} 
                                      alt="Message attachment" 
                                      className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-md"
                                      onClick={() => window.open(msg.imageUrl, '_blank')}
                                    />
                                  </div>
                                )}
                                <div className="break-words leading-relaxed">{msg.content}</div>
                                <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[10px]">
                                  <span className={msg.senderId === user?.id ? "text-blue-100" : "text-gray-500"}>
                                    {formatTime(msg.createdAt)}
                                  </span>
                                  {msg.senderId === user?.id && (
                                    <span className="flex items-center">
                                      <Check className={`w-3 h-3 ${msg.isRead ? 'text-blue-100' : 'text-blue-100'}`} />
                                      {msg.isRead && <CheckCheck className="w-3 h-3 text-blue-100 ml-0.5" />}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                    
                    {/* Typing indicator */}
                    {isTyping && typingUsers.length > 0 && (
                      <div className="flex justify-start items-end gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-[10px] flex-shrink-0">
                          {currentChat.Customer?.username?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-gray-200 shadow-sm">
                          <div className="flex items-center space-x-1.5">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                            </div>
                            <span className="ml-2 text-gray-600 text-xs font-medium">typing...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="px-4 pb-3 bg-white border-t border-gray-100">
                      <div className="relative max-w-[180px]">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="rounded-xl max-w-full h-auto shadow-md border border-gray-200"
                        />
                        <button
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview("");
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Input */}
                  <div className="p-3 border-t border-gray-200 bg-white">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                        title="Attach image"
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
                        className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all"
                        placeholder="Type a message..."
                      />
                      
                      <button
                        onClick={handleSendMessage}
                        className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        disabled={!message.trim() && !selectedImage}
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
                <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-white via-gray-50 to-white">
                  <div className="text-center px-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <MessageCircle className="w-10 h-10 text-blue-600" />
                    </div>
                    <h2 className="text-base font-semibold text-gray-900 mb-2">Select a conversation</h2>
                    <p className="text-sm text-gray-600 max-w-xs mx-auto">Choose a chat from the sidebar to start messaging with your customers</p>
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
