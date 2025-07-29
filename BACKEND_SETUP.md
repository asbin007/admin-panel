# Backend Chat Setup Guide

## 🔧 **Backend Setup Required**

The chat system is currently using fallback mock data because the backend chat routes are not properly registered. Here's how to fix this:

### **1. Register Chat Routes in Main Server File**

Add this to your main server file (usually `app.js`, `index.js`, or `server.js`):

```javascript
// Import chat routes
const chatRoutes = require('./routes/chatRoutes');

// Register chat routes
app.use('/api/chat', chatRoutes);
```

### **2. Complete Backend Setup**

Make sure you have these files in your backend:

#### **Routes File: `routes/chatRoutes.js`**
```javascript
import express, { Router } from "express";
import errorHandler from "../services/errorHandler";
import chatController from "../controllers/chatController";
import userMiddleware from "../middleware/userMiddleware";

const router: Router = express.Router();

// POST: Create or get an existing chat
router.post("/get-or-create", userMiddleware.isUserLoggedIn, errorHandler(chatController.getOrCreateChat));

// GET: Fetch all messages in a chat
router.get("/:chatId/messages", userMiddleware.isUserLoggedIn, errorHandler(chatController.getChatMessages));

// POST: Send a message
router.post("/send-message", userMiddleware.isUserLoggedIn, errorHandler(chatController.sendMessage));

// GET: Get all chats for current user
router.get("/all", userMiddleware.isUserLoggedIn, errorHandler(chatController.getAllChats));

// GET: Get unread message count
router.get("/unread/count", userMiddleware.isUserLoggedIn, errorHandler(chatController.getUnreadCount));

// GET: Get all admin users (for customer to choose from)
router.get("/admins", userMiddleware.isUserLoggedIn, errorHandler(chatController.getAdminUsers));

// GET: Get chat statistics (admin only)
router.get("/stats", userMiddleware.isUserLoggedIn, errorHandler(chatController.getChatStats));

// POST: Mark messages as read
router.post("/:chatId/mark-read", userMiddleware.isUserLoggedIn, errorHandler(chatController.markMessageAsRead));

export default router;
```

#### **Controller File: `controllers/chatController.js`**
```javascript
// Basic controller structure - implement your logic
const chatController = {
  getOrCreateChat: async (req, res) => {
    // Implementation for creating/getting chat
  },
  
  getChatMessages: async (req, res) => {
    // Implementation for getting messages
  },
  
  sendMessage: async (req, res) => {
    // Implementation for sending message
  },
  
  getAllChats: async (req, res) => {
    // Implementation for getting all chats
  },
  
  getUnreadCount: async (req, res) => {
    // Implementation for unread count
  },
  
  getAdminUsers: async (req, res) => {
    // Implementation for getting admin users
  },
  
  getChatStats: async (req, res) => {
    // Implementation for chat statistics
  },
  
  markMessageAsRead: async (req, res) => {
    // Implementation for marking messages as read
  }
};

module.exports = chatController;
```

### **3. Database Models**

You'll need these database models:

#### **Chat Model**
```javascript
// Chat table structure
{
  id: UUID,
  customerId: UUID,
  adminId: UUID,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP
}
```

#### **Message Model**
```javascript
// Message table structure
{
  id: UUID,
  chatId: UUID,
  senderId: UUID,
  receiverId: UUID,
  content: TEXT,
  read: BOOLEAN,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP
}
```

### **4. WebSocket Events**

Add these WebSocket events to your backend:

```javascript
// In your Socket.IO setup
socket.on('joinChat', (chatId) => {
  socket.join(chatId);
});

socket.on('sendMessage', (data) => {
  // Save message to database
  // Broadcast to chat room
  socket.to(data.chatId).emit('receiveMessage', message);
});

socket.on('typing', (data) => {
  socket.to(data.chatId).emit('typing', data);
});

socket.on('stopTyping', (data) => {
  socket.to(data.chatId).emit('stopTyping', data);
});

socket.on('markAsRead', (data) => {
  // Mark messages as read in database
});
```

## 🚀 **Current Status**

### **✅ Working (Frontend Only):**
- Chat interface displays mock data
- Message sending works locally
- UI is fully functional
- Real-time features simulated

### **❌ Not Working (Backend Integration):**
- API calls return 404
- Messages not persisted
- Real-time updates not working
- No actual chat functionality

## 🔄 **Next Steps**

1. **Register chat routes** in your main server file
2. **Implement controller methods** with your database logic
3. **Set up database models** for chats and messages
4. **Add WebSocket events** for real-time messaging
5. **Test the complete system**

## 📝 **Testing**

Once backend is set up:

1. **Start backend server** on port 5001
2. **Login as admin** in admin dashboard
3. **Go to `/chat`** page
4. **Login as customer** in frontend
5. **Click chat button** to start conversation
6. **Send messages** and verify real-time updates

The frontend is ready and will automatically switch from mock data to real backend data once the routes are properly registered! 