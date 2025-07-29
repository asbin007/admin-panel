# Backend Chat Route Setup Guide

## 🔧 **Route Registration Required**

Based on your `ChatController`, here's how to properly register the chat routes in your main server file:

### **1. Main Server File Setup**

Add this to your main server file (usually `app.js`, `index.js`, or `server.js`):

```javascript
// Import chat routes
const chatRoutes = require('./routes/chatRoutes');

// Register chat routes - IMPORTANT: Add this line
app.use('/api/chat', chatRoutes);
```

### **2. Complete Routes File**

Create or update `routes/chatRoutes.js`:

```javascript
import express, { Router } from "express";
import errorHandler from "../services/errorHandler";
import chatController from "../controllers/chatController";
import userMiddleware from "../middleware/userMiddleware";

const router = express.Router();

// GET: Get all chats for current user (ADMIN PRIORITY)
router.get("/all", userMiddleware.isUserLoggedIn, errorHandler(chatController.getAllChats));

// GET: Get all admin users (for customer to choose from)
router.get("/admins", userMiddleware.isUserLoggedIn, errorHandler(chatController.getAdminUsers));

// GET: Get unread message count
router.get("/unread/count", userMiddleware.isUserLoggedIn, errorHandler(chatController.getUnreadCount));

// GET: Get chat statistics (admin only)
router.get("/stats", userMiddleware.isUserLoggedIn, errorHandler(chatController.getChatStats));

// POST: Create or get an existing chat
router.post("/get-or-create", userMiddleware.isUserLoggedIn, errorHandler(chatController.getOrCreateChat));

// POST: Send a message
router.post("/send-message", userMiddleware.isUserLoggedIn, errorHandler(chatController.sendMessage));

// POST: Mark messages as read
router.post("/:chatId/mark-read", userMiddleware.isUserLoggedIn, errorHandler(chatController.markMessageAsRead));

// GET: Fetch all messages in a chat (MUST BE LAST - dynamic route)
router.get("/:chatId/messages", userMiddleware.isUserLoggedIn, errorHandler(chatController.getChatMessages));

export default router;
```

### **3. Critical Route Order**

**IMPORTANT:** The route order matters! Static routes must come before dynamic routes:

```javascript
// ✅ CORRECT ORDER:
router.get("/all", ...);           // Static route
router.get("/admins", ...);        // Static route
router.get("/unread/count", ...);  // Static route
router.get("/stats", ...);         // Static route
router.get("/:chatId/messages", ...); // Dynamic route (LAST)

// ❌ WRONG ORDER:
router.get("/:chatId/messages", ...); // Dynamic route (FIRST)
router.get("/all", ...);           // This will never be reached!
```

### **4. Server File Example**

Your main server file should look like this:

```javascript
import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chatRoutes';
// ... other imports

const app = express();

app.use(cors());
app.use(express.json());

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);  // ← ADD THIS LINE

// ... rest of your server setup
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: 404 on `/api/chat/all`**
**Cause:** Route not registered or wrong order
**Solution:** 
1. Check if `app.use('/api/chat', chatRoutes)` is added
2. Verify route order in `chatRoutes.js`
3. Ensure `getAllChats` method exists in controller

### **Issue 2: "Admin not found"**
**Cause:** No admin users in database
**Solution:**
```sql
-- Check if admin exists
SELECT * FROM users WHERE role = 'admin';

-- Create admin if needed
INSERT INTO users (username, email, password, role, createdAt, updatedAt)
VALUES ('admin', 'admin@shoemart.com', 'hashed_password', 'admin', NOW(), NOW());
```

### **Issue 3: Route conflicts**
**Cause:** Dynamic routes before static routes
**Solution:** Move `/:chatId/messages` to the end of the routes file

## 🧪 **Testing Your Routes**

### **Test Script:**
```javascript
// Run this in browser console
const testRoutes = async () => {
  const token = localStorage.getItem('tokenauth');
  const baseUrl = 'http://localhost:5001/api';
  
  const routes = [
    { method: 'GET', path: '/chat/all' },
    { method: 'GET', path: '/chat/admins' },
    { method: 'POST', path: '/chat/get-or-create', body: { adminId: 'test' } },
    { method: 'POST', path: '/chat/send-message', body: { chatId: 'test', content: 'test' } }
  ];
  
  for (const route of routes) {
    try {
      const response = await fetch(`${baseUrl}${route.path}`, {
        method: route.method,
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: route.body ? JSON.stringify(route.body) : undefined
      });
      
      console.log(`${route.method} ${route.path}: ${response.status}`);
    } catch (error) {
      console.log(`${route.method} ${route.path}: ERROR - ${error.message}`);
    }
  }
};

testRoutes();
```

## ✅ **Expected Results**

After proper setup, you should see:
- ✅ `GET /api/chat/all` returns 200 with chat list
- ✅ `GET /api/chat/admins` returns 200 with admin list
- ✅ `POST /api/chat/get-or-create` returns 200 with chat object
- ✅ `POST /api/chat/send-message` returns 200 with message object

## 🔄 **Next Steps**

1. **Add the route registration** to your main server file
2. **Check route order** in `chatRoutes.js`
3. **Restart your backend server**
4. **Test the endpoints** using the test script
5. **Verify frontend integration** works

The frontend is ready and will work immediately once the routes are properly registered! 