 import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Status } from "./authSlice";
import { APIS } from "@/globals/http";
import { AppDispatch } from "./store";

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  chatId: string;
  createdAt: string;
  read: boolean;
  Sender?: {
    id: string;
    username: string;
    role: string;
  };
}

export interface Chat {
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

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  status: Status;
  unreadCount: number;
}

const initialState: ChatState = {
  chats: [],
  currentChat: null,
  messages: [],
  status: Status.SUCCESS,
  unreadCount: 0,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChats: (state, action: PayloadAction<Chat[]>) => {
      state.chats = action.payload;
    },
    setCurrentChat: (state, action: PayloadAction<Chat | null>) => {
      state.currentChat = action.payload;
    },
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    updateChatLastMessage: (state, action: PayloadAction<{ chatId: string; message: Message }>) => {
      const chat = state.chats.find(c => c.id === action.payload.chatId);
      if (chat) {
        chat.Messages = chat.Messages || [];
        chat.Messages.push(action.payload.message);
        chat.updatedAt = action.payload.message.createdAt;
      }
    },
    setStatus: (state, action: PayloadAction<Status>) => {
      state.status = action.payload;
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    markChatAsRead: (state, action: PayloadAction<string>) => {
      const chat = state.chats.find(c => c.id === action.payload);
      if (chat) {
        chat.unreadCount = 0;
      }
    },
  },
});

export const {
  setChats,
  setCurrentChat,
  setMessages,
  addMessage,
  updateChatLastMessage,
  setStatus,
  setUnreadCount,
  markChatAsRead,
} = chatSlice.actions;

export default chatSlice.reducer;

// Thunks
export function fetchAdminChats() {
  return async function fetchAdminChatsThunk(dispatch: AppDispatch) {
    try {
      dispatch(setStatus(Status.LOADING));
      
      // Check if token exists before making request
      const token = localStorage.getItem("tokenauth");
      if (!token) {
        console.error("❌ No authentication token found");
        dispatch(setChats([]));
        dispatch(setStatus(Status.ERROR));
        return;
      }
      
      console.log("🔑 Token found, making request to /chats/admin/all");
      console.log("🌐 Full URL:", "https://nike-backend-1-g9i6.onrender.com/api/chats/admin/all");
      
      // Try to get admin chats using admin-specific endpoint
      const response = await APIS.get("/chats/admin/all");
      
      if (response.status === 200) {
        dispatch(setChats(response.data.data || []));
        dispatch(setStatus(Status.SUCCESS));
        console.log("✅ Admin chats loaded successfully with", response.data.data?.length || 0, "chats");
      } else {
        console.log("⚠️ Chat stats endpoint returned error, using fallback");
        dispatch(setChats([]));
        dispatch(setStatus(Status.SUCCESS));
      }
    } catch (error) {
      console.error("Error fetching admin chats:", error);
      
      // Handle different types of errors
      if (error && typeof error === 'object') {
        const axiosError = error as any;
        
        // Check if it's a 401 error (authentication issue)
        if (axiosError.response?.status === 401) {
          console.error("❌ Authentication failed - Token may be invalid or expired");
          console.error("🔑 Current token:", localStorage.getItem("tokenauth")?.substring(0, 20) + "...");
          console.error("📋 Error details:", axiosError.response?.data);
          
          // Clear invalid token
          localStorage.removeItem("tokenauth");
          localStorage.removeItem("userData");
          dispatch(setStatus(Status.ERROR));
          return;
        }
        
        // Check if it's a request aborted error
        if (axiosError.code === 'ERR_CANCELED' || axiosError.message === 'Request aborted') {
          console.warn("⚠️ Request was aborted - this is normal during component unmount");
          return; // Don't dispatch empty chats if request was aborted
        }
        
        // Check if it's a 403 error (role access issue)
        if (axiosError.response?.status === 403) {
          console.warn("⚠️ Admin chat access denied - chat functionality may not be available for admin role");
          console.warn("ℹ️ This is expected if chat system is customer-only");
        }
        
        // Check if it's a network error
        if (axiosError.code === 'NETWORK_ERROR' || axiosError.message?.includes('Network Error') || axiosError.code === 'ERR_NETWORK') {
          console.warn("⚠️ Network error - Backend server may be down, using fallback");
        }
      }
      
      dispatch(setChats([]));
      dispatch(setStatus(Status.SUCCESS));
    }
  };
}

export function fetchCustomerChats() {
  return async function fetchCustomerChatsThunk(dispatch: AppDispatch) {
    try {
      dispatch(setStatus(Status.LOADING));
      
      const response = await APIS.get("/chats/all");
      
      if (response.status === 200) {
        dispatch(setChats(response.data.data || []));
        dispatch(setStatus(Status.SUCCESS));
        console.log("✅ Customer chats loaded successfully");
      } else {
        console.log("⚠️ Customer chat endpoint returned error, using fallback");
        dispatch(setChats([]));
        dispatch(setStatus(Status.SUCCESS));
      }
    } catch (error) {
      console.error("Error fetching customer chats:", error);
      dispatch(setChats([]));
      dispatch(setStatus(Status.SUCCESS));
    }
  };
}

export function fetchChatMessages(chatId: string) {
  return async function fetchChatMessagesThunk(dispatch: AppDispatch) {
    try {
      const response = await APIS.get(`/chats/admin/${chatId}/messages`);
      
      if (response.status === 200) {
        dispatch(setMessages(response.data.data || []));
      }
    } catch (error) {
      console.error("Error fetching chat messages:", error);
    }
  };
}

export function createChat(customerId: string) {
  return async function createChatThunk(dispatch: AppDispatch) {
    try {
      const response = await APIS.post("/chats/get-or-create", { customerId });
      
      if (response.status === 201 || response.status === 200) {
        // Refresh chats list
        dispatch(fetchAdminChats());
        return response.data.data;
      }
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };
}

export function sendMessage(chatId: string, content: string) {
  return async function sendMessageThunk(dispatch: AppDispatch) {
    try {
      const response = await APIS.post("/chats/admin/send-message", { 
        chatId, 
        content 
      });
      
      if (response.status === 201 || response.status === 200) {
        const message = response.data.data;
        dispatch(addMessage(message));
        dispatch(updateChatLastMessage({ chatId, message }));
        return message;
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
}

export function markMessagesAsRead(chatId: string) {
  return async function markMessagesAsReadThunk(dispatch: AppDispatch) {
    try {
      await APIS.post(`/chats/${chatId}/mark-read`);
      dispatch(markChatAsRead(chatId));
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };
} 