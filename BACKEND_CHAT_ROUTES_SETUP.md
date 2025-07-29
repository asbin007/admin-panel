# Backend Chat Routes Setup Guide

## 🚨 **Issue Identified**

Your backend has:
- ✅ **WebSocket chat implementation** (working)
- ✅ **ChatController** (complete)
- ❌ **Missing HTTP route registration** (causing 404 errors)

## 🔧 **Solution: Add Chat Routes to Your Server**

### **Step 1: Create Chat Routes File**

Create `src/routes/chatRoutes.ts`:

```typescript
import express, { Router } from "express";
import chatController from "../controllers/chatController";
import userMiddleware from "../middleware/userMiddleware";

const router: Router = express.Router();

// GET: Get all chats for current user (ADMIN PRIORITY)
router.get("/all", userMiddleware.isUserLoggedIn, chatController.getAllChats);

// GET: Get all admin users (for customer to choose from)
router.get("/admins", userMiddleware.isUserLoggedIn, chatController.getAdminUsers);

// GET: Get unread message count
router.get("/unread/count", userMiddleware.isUserLoggedIn, chatController.getUnreadCount);

// GET: Get chat statistics (admin only)
router.get("/stats", userMiddleware.isUserLoggedIn, chatController.getChatStats);

// POST: Create or get an existing chat
router.post("/get-or-create", userMiddleware.isUserLoggedIn, chatController.getOrCreateChat);

// POST: Send a message
router.post("/send-message", userMiddleware.isUserLoggedIn, chatController.sendMessage);

// POST: Mark messages as read
router.post("/:chatId/mark-read", userMiddleware.isUserLoggedIn, chatController.markMessageAsRead);

// GET: Fetch all messages in a chat (MUST BE LAST - dynamic route)
router.get("/:chatId/messages", userMiddleware.isUserLoggedIn, chatController.getChatMessages);

export default router;
```

### **Step 2: Update Your Main Server File**

Add this to your main server file (the one you showed me):

```typescript
import jwt from "jsonwebtoken";
import adminSeeder from "./src/adminSeeder";
import app from "./src/app";
import { envConfig } from "./src/config/config";
import categoryController from "./src/controllers/categoryController";
import collectionController from "./src/controllers/collectionController";

// 🔥 ADD THIS IMPORT
import chatRoutes from "./src/routes/chatRoutes";

import { Server, Socket } from "socket.io";
import User from "./src/database/models/userModel";
import Order from "./src/database/models/orderModel";
import Payment from "./src/database/models/paymentModel";
import Message from "./src/database/models/messageModel";
import Chat from "./src/database/models/chatModel";

function startServer() {
  const server = app.listen(envConfig.port, () => {
    categoryController.seedCategory();

    console.log(`Server is running on port ${envConfig.port}`);
    adminSeeder();
    collectionController.seedCollection();
  });

  // 🔥 ADD THIS LINE - Register chat routes
  app.use('/api/chat', chatRoutes);

  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:3000"],
    },
  });

  // ... rest of your WebSocket code stays the same
}

startServer();
```

### **Step 3: Verify Your App File**

Make sure your `src/app.ts` has the basic Express setup:

```typescript
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Your existing routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
// ... other routes

export default app;
```

## 🧪 **Testing Your Setup**

### **Test Script:**
```javascript
// Run this in browser console after restarting your server
const testChatRoutes = async () => {
  const token = localStorage.getItem('tokenauth');
  const baseUrl = 'http://localhost:5001/api';
  
  console.log('🔍 Testing Chat Routes...\n');
  
  const routes = [
    { method: 'GET', path: '/chat/all' },
    { method: 'GET', path: '/chat/admins' },
    { method: 'GET', path: '/chat/unread/count' },
    { method: 'GET', path: '/chat/stats' }
  ];
  
  for (const route of routes) {
    try {
      const response = await fetch(`${baseUrl}${route.path}`, {
        method: route.method,
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`${route.method} ${route.path}: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   Response:', data);
      } else {
        const error = await response.text();
        console.log('   Error:', error);
      }
    } catch (error) {
      console.log(`${route.method} ${route.path}: ERROR - ${error.message}`);
    }
    console.log('');
  }
};

testChatRoutes();
```

## ✅ **Expected Results**

After adding the routes, you should see:
- ✅ `GET /api/chat/all` returns 200 with chat list
- ✅ `GET /api/chat/admins` returns 200 with admin list
- ✅ `POST /api/chat/get-or-create` returns 200 with chat object
- ✅ `POST /api/chat/send-message` returns 200 with message object

## 🔄 **Next Steps**

1. **Create the chatRoutes.ts file** with the code above
2. **Add the import and route registration** to your main server file
3. **Restart your backend server**
4. **Test the endpoints** using the test script
5. **Verify frontend integration** works

## 🚀 **Complete Integration**

Once routes are registered:
- ✅ **Admin dashboard** will show real customer chats
- ✅ **Customer chat widget** will work properly
- ✅ **Real-time messaging** via WebSocket will be fully functional
- ✅ **Message persistence** in database will work
- ✅ **Unread counts** will update automatically

The frontend is already configured and will work immediately once the routes are properly registered! 