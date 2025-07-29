// Test script to check which chat endpoints are available
// Run this in browser console or Node.js to test your backend

const testChatEndpoints = async () => {
  const baseUrl = 'http://localhost:5001/api';
  const token = localStorage.getItem('tokenauth') || 'your-token-here';
  
  const endpoints = [
    '/chat/all',
    '/chat',
    '/chat/admin',
    '/chat/customer',
    '/chat/get-or-create',
    '/chat/send-message',
    '/chat/unread/count',
    '/chat/admins',
    '/chat/stats'
  ];

  console.log('🔍 Testing Chat Endpoints...\n');

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
        console.log(`   Response:`, data);
      } else {
        console.log(`❌ ${endpoint} - Status: ${response.status} (${response.statusText})`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
    console.log('');
  }

  // Test POST endpoints
  console.log('🔍 Testing POST Endpoints...\n');
  
  const postEndpoints = [
    {
      url: '/chat/get-or-create',
      data: { customerId: 'test-customer-id' }
    },
    {
      url: '/chat/send-message',
      data: { chatId: 'test-chat-id', content: 'Test message' }
    }
  ];

  for (const endpoint of postEndpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint.url}`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(endpoint.data)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint.url} - Status: ${response.status}`);
        console.log(`   Response:`, data);
      } else {
        console.log(`❌ ${endpoint.url} - Status: ${response.status} (${response.statusText})`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.url} - Error: ${error.message}`);
    }
    console.log('');
  }
};

// Instructions for running this test:
console.log(`
📋 CHAT ENDPOINT TEST INSTRUCTIONS:

1. Open browser console on your admin dashboard
2. Copy and paste this entire script
3. Run: testChatEndpoints()
4. Check which endpoints return 200 vs 404

This will help identify which chat routes are properly registered in your backend.
`);

// Uncomment to run automatically
// testChatEndpoints(); 