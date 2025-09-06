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
      
      const response = await APIS.get("/chats/all");
      
      if (response.status === 200) {
        dispatch(setChats(response.data.data || []));
        dispatch(setStatus(Status.SUCCESS));
        console.log("✅ Admin chats loaded successfully");
      } else {
        console.log("⚠️ Chat endpoint returned error, using fallback");
        dispatch(setChats([]));
        dispatch(setStatus(Status.SUCCESS));
      }
    } catch (error) {
      console.error("Error fetching admin chats:", error);
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
      const response = await APIS.get(`/chat/${chatId}/messages`);
      
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
      const response = await APIS.post("/chat/get-or-create", { customerId });
      
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
      const response = await APIS.post("/chat/send-message", { 
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
      await APIS.post(`/chat/${chatId}/mark-read`);
      dispatch(markChatAsRead(chatId));
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };
} 