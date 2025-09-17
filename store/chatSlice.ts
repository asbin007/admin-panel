import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { APIS } from '../globals/http';

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  readAt?: string;
  isEdited: boolean;
  editedAt?: string;
  replyToId?: string;
  createdAt: string;
  updatedAt: string;
  Sender?: User;
  Receiver?: User;
}

export interface Chat {
  id: string;
  customerId: string;
  adminId: string;
  lastMessage?: string;
  lastMessageAt?: string;
  isActive: boolean;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  Customer?: User;
  Admin?: User;
  Messages?: Message[];
}

export enum Status {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  adminUsers: User[];
  status: Status;
  error: string | null;
  unreadCount: number;
  isTyping: boolean;
  typingUsers: string[];
}

const initialState: ChatState = {
  chats: [],
  currentChat: null,
  messages: [],
  adminUsers: [],
  status: Status.IDLE,
  error: null,
  unreadCount: 0,
  isTyping: false,
  typingUsers: [],
};

// Async thunks
export const fetchAdminUsers = createAsyncThunk(
  'chat/fetchAdminUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await APIS.get('/chats/admins');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch admin users');
    }
  }
);

export const createOrGetChat = createAsyncThunk(
  'chat/createOrGetChat',
  async ({ adminId }: { adminId: string }, { rejectWithValue }) => {
    try {
      const response = await APIS.post('/chats/create-or-get', { adminId });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create/get chat');
    }
  }
);

export const fetchAllChats = createAsyncThunk(
  'chat/fetchAllChats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await APIS.get('/chats/admin/all');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch chats');
    }
  }
);

export const fetchChatMessages = createAsyncThunk(
  'chat/fetchChatMessages',
  async ({ chatId, page = 1, limit = 50 }: { chatId: string; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await APIS.get(`/chats/admin/${chatId}/messages?page=${page}&limit=${limit}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ chatId, content, messageType = 'text', replyToId, image }: { 
    chatId: string; 
    content: string; 
    messageType?: 'text' | 'image' | 'file' | 'system';
    replyToId?: string;
    image?: File;
  }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('chatId', chatId);
      formData.append('content', content);
      formData.append('messageType', messageType);
      if (replyToId) formData.append('replyToId', replyToId);
      if (image) formData.append('image', image);

      const response = await APIS.post('/chats/admin/send-message', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const markMessagesAsRead = createAsyncThunk(
  'chat/markMessagesAsRead',
  async (chatId: string, { rejectWithValue }) => {
    try {
      await APIS.post(`/chats/admin/${chatId}/mark-read`);
      return chatId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark messages as read');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'chat/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await APIS.get('/chats/admin/unread/count');
      return response.data.data.unreadCount;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch unread count');
    }
  }
);

// Chat slice
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentChat: (state, action: PayloadAction<Chat | null>) => {
      state.currentChat = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      if (!state.messages) {
        state.messages = [];
      }
      state.messages.push(action.payload);
    },
    updateMessage: (state, action: PayloadAction<Message>) => {
      if (!state.messages) {
        state.messages = [];
      }
      const index = state.messages.findIndex(msg => msg.id === action.payload.id);
      if (index !== -1) {
        state.messages[index] = action.payload;
      }
    },
    setTyping: (state, action: PayloadAction<{ isTyping: boolean; userId?: string }>) => {
      state.isTyping = action.payload.isTyping;
      if (action.payload.userId) {
        if (!state.typingUsers) {
          state.typingUsers = [];
        }
        if (action.payload.isTyping) {
          state.typingUsers.push(action.payload.userId);
        } else {
          state.typingUsers = state.typingUsers.filter(id => id !== action.payload.userId);
        }
      }
    },
    clearTyping: (state) => {
      state.isTyping = false;
      state.typingUsers = [];
    },
    updateChatLastMessage: (state, action: PayloadAction<{ chatId: string; message: Message }>) => {
      const chat = state.chats.find(c => c.id === action.payload.chatId);
      if (chat) {
        chat.lastMessage = action.payload.message.content;
        chat.lastMessageAt = action.payload.message.createdAt;
        chat.unreadCount += 1;
      }
    },
    markChatAsRead: (state, action: PayloadAction<string>) => {
      const chat = state.chats.find(c => c.id === action.payload);
      if (chat) {
        chat.unreadCount = 0;
      }
      if (state.messages) {
        state.messages.forEach(msg => {
          if (msg.chatId === action.payload) {
            msg.isRead = true;
          }
        });
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    resetChatState: (state) => {
      state.chats = [];
      state.currentChat = null;
      state.messages = [];
      state.adminUsers = [];
      state.status = Status.IDLE;
      state.error = null;
      state.unreadCount = 0;
      state.isTyping = false;
      state.typingUsers = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch admin users
    builder
      .addCase(fetchAdminUsers.pending, (state) => {
        state.status = Status.LOADING;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.status = Status.SUCCESS;
        state.adminUsers = action.payload;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.status = Status.ERROR;
        state.error = action.payload as string;
      });

    // Create or get chat
    builder
      .addCase(createOrGetChat.pending, (state) => {
        state.status = Status.LOADING;
      })
      .addCase(createOrGetChat.fulfilled, (state, action) => {
        state.status = Status.SUCCESS;
        state.currentChat = action.payload;
        // Add to chats if not already present
        const existingChat = state.chats.find(c => c.id === action.payload.id);
        if (!existingChat) {
          state.chats.unshift(action.payload);
        }
      })
      .addCase(createOrGetChat.rejected, (state, action) => {
        state.status = Status.ERROR;
        state.error = action.payload as string;
      });

    // Fetch all chats
    builder
      .addCase(fetchAllChats.pending, (state) => {
        state.status = Status.LOADING;
      })
      .addCase(fetchAllChats.fulfilled, (state, action) => {
        state.status = Status.SUCCESS;
        state.chats = action.payload;
      })
      .addCase(fetchAllChats.rejected, (state, action) => {
        state.status = Status.ERROR;
        state.error = action.payload as string;
      });

    // Fetch chat messages
    builder
      .addCase(fetchChatMessages.pending, (state) => {
        state.status = Status.LOADING;
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        state.status = Status.SUCCESS;
        state.messages = action.payload.messages;
      })
      .addCase(fetchChatMessages.rejected, (state, action) => {
        state.status = Status.ERROR;
        state.error = action.payload as string;
      });

    // Send message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.status = Status.LOADING;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.status = Status.SUCCESS;
        if (!state.messages) {
          state.messages = [];
        }
        state.messages.push(action.payload);
        // Update chat last message
        const chat = state.chats.find(c => c.id === action.payload.chatId);
        if (chat) {
          chat.lastMessage = action.payload.content;
          chat.lastMessageAt = action.payload.createdAt;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.status = Status.ERROR;
        state.error = action.payload as string;
      });

    // Mark messages as read
    builder
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const chat = state.chats.find(c => c.id === action.payload);
        if (chat) {
          chat.unreadCount = 0;
        }
        if (state.messages) {
          state.messages.forEach(msg => {
            if (msg.chatId === action.payload) {
              msg.isRead = true;
            }
          });
        }
      });

    // Fetch unread count
    builder
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      });
  },
});

export const {
  setCurrentChat,
  addMessage,
  updateMessage,
  setTyping,
  clearTyping,
  updateChatLastMessage,
  markChatAsRead,
  clearError,
  resetChatState,
} = chatSlice.actions;

export default chatSlice.reducer;
