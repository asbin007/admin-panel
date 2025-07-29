// Debug script to check why no chats are showing in admin
// Run this in browser console

const debugChatSystem = async () => {
  const token = localStorage.getItem('tokenauth');
  const baseUrl = 'http://localhost:5001/api';
  
  console.log('🔍 Debugging Chat System...\n');
  
  // 1. Check if user is logged in
  console.log('1️⃣ Checking authentication...');
  console.log('Token exists:', !!token);
  console.log('Token:', token ? token.substring(0, 20) + '...' : 'None');
  
  // 2. Test chat endpoints
  console.log('\n2️⃣ Testing chat endpoints...');
  
  const endpoints = [
    { name: 'Get All Chats', url: '/chats/all' },
    { name: 'Get Admin Users', url: '/chats/admins' },
    { name: 'Get Unread Count', url: '/chats/unread/count' },
    { name: 'Get Chat Stats', url: '/chats/stats' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint.url}`, {
        headers: { 
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`\n${endpoint.name} (${endpoint.url}):`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   Response:`, data);
        
        if (endpoint.url === '/chats/all') {
          console.log(`   Chats count: ${data.data?.length || 0}`);
          if (data.data && data.data.length > 0) {
            console.log(`   First chat:`, data.data[0]);
          }
        }
      } else {
        const errorText = await response.text();
        console.log(`   Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`\n${endpoint.name} (${endpoint.url}):`);
      console.log(`   Error: ${error.message}`);
    }
  }
  
  // 3. Check current user info
  console.log('\n3️⃣ Checking current user...');
  try {
    const userResponse = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': token }
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('   Current user:', userData);
    } else {
      console.log('   Could not get user info');
    }
  } catch (error) {
    console.log('   Error getting user info:', error.message);
  }
  
  // 4. Check if there are any chats in database
  console.log('\n4️⃣ Checking database for chats...');
  console.log('   (This would require backend logs or database query)');
  
  // 5. Test creating a chat
  console.log('\n5️⃣ Testing chat creation...');
  try {
    // First get admin users
    const adminResponse = await fetch(`${baseUrl}/chats/admins`, {
      headers: { 'Authorization': token }
    });
    
    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      console.log('   Available admins:', adminData);
      
      if (adminData.data && adminData.data.length > 0) {
        const adminId = adminData.data[0].id;
        console.log(`   Using admin ID: ${adminId}`);
        
        // Try to create a test chat
        const createResponse = await fetch(`${baseUrl}/chats/get-or-create`, {
          method: 'POST',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ adminId })
        });
        
        console.log(`   Create chat status: ${createResponse.status}`);
        if (createResponse.ok) {
          const createData = await createResponse.json();
          console.log('   Created chat:', createData);
        } else {
          const errorText = await createResponse.text();
          console.log('   Create error:', errorText);
        }
      }
    }
  } catch (error) {
    console.log('   Error testing chat creation:', error.message);
  }
  
  console.log('\n✅ Debug complete!');
};

// Run the debug
debugChatSystem(); 