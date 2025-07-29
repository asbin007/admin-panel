// Script to create a default admin user for the chat system
// Run this script if you get "Admin not found" error

const createDefaultAdmin = async () => {
  try {
    const response = await fetch('http://localhost:5001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        email: 'admin@shoemart.com',
        password: 'admin123',
        role: 'admin'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Default admin created successfully:', data);
    } else {
      const error = await response.json();
      console.log('❌ Admin creation failed:', error);
    }
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  }
};

// Instructions for manual admin creation:
console.log(`
📋 MANUAL ADMIN CREATION INSTRUCTIONS:

If you're getting "Admin not found" error, you need to create an admin user first.

Method 1 - Using your existing registration:
1. Go to your registration page
2. Register a new user with role: 'admin'
3. Use this data:
   - Username: admin
   - Email: admin@shoemart.com
   - Password: admin123
   - Role: admin

Method 2 - Direct API call:
POST http://localhost:5001/api/auth/register
{
  "username": "admin",
  "email": "admin@shoemart.com", 
  "password": "admin123",
  "role": "admin"
}

Method 3 - Database direct:
INSERT INTO users (username, email, password, role, createdAt, updatedAt)
VALUES ('admin', 'admin@shoemart.com', 'hashed_password', 'admin', NOW(), NOW());

After creating the admin, the chat system should work properly.
`);

// Uncomment the line below to automatically create admin
// createDefaultAdmin(); 