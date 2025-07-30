# Backend Resend Verification Setup Guide

## 🔧 **Backend Implementation for Resend Email Verification**

This guide will help you implement the resend verification functionality in your backend.

## 📁 **1. Update SuperAdminController**

Add these methods to your `controllers/superAdminController.ts`:

```typescript
// Add these imports at the top
import otpGenerator from "otp-generator";
import sendMail from "../services/sendMail";

// Add this method to your SuperAdminController class
static async resendVerificationEmail(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { email } = req.body;

    // Find the admin by ID or email
    const admin = await User.findOne({ 
      where: { 
        $or: [
          { id: id },
          { email: email }
        ],
        role: 'admin',
        isVerified: false 
      } 
    });

    if (!admin) {
      res.status(404).json({ message: "Admin not found or already verified" });
      return;
    }

    // Generate new OTP
    const otp = otpGenerator.generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
      digits: true,
    });

    // Update admin with new OTP
    admin.otp = otp;
    admin.otpGeneratedTime = Date.now().toString();
    await admin.save();

    // Send verification email
    try {
      await sendMail({
        to: admin.email,
        subject: "Admin Account Verification - SHOEMART",
        text: `Your admin account verification OTP is: ${otp}. This OTP will expire in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Admin Account Verification - SHOEMART</h2>
            <p>Hi ${admin.username},</p>
            <p>Your admin account verification OTP is:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #000; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <p>After verification, you can login with your email and password.</p>
            <p>Best regards,<br>SHOEMART Super Admin</p>
          </div>
        `
      });

      res.status(200).json({ 
        message: "Verification email sent successfully",
        email: admin.email 
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      res.status(500).json({ message: "Failed to send verification email" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}
```

## 📁 **2. Update UserController**

Add these methods to your `controllers/userController.ts`:

```typescript
// Add these imports at the top
import otpGenerator from "otp-generator";
import sendMail from "../services/sendMail";

// Add this method to your UserController class
static async resendOtp(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if user is pending verification
    if (user.isVerified) {
      res.status(400).json({ message: "User is already verified" });
      return;
    }

    // Generate new OTP
    const otp = otpGenerator.generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
      digits: true,
    });

    // Update user with new OTP
    user.otp = otp;
    user.otpGeneratedTime = Date.now().toString();
    await user.save();

    // Send verification email
    try {
      await sendMail({
        to: user.email,
        subject: "Email Verification - SHOEMART",
        text: `Your verification OTP is: ${otp}. This OTP will expire in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Email Verification - SHOEMART</h2>
            <p>Hi ${user.username},</p>
            <p>Your verification OTP is:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #000; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <p>Enter this OTP on the verification page to complete your registration.</p>
            <p>Best regards,<br>SHOEMART Team</p>
          </div>
        `
      });

      res.status(200).json({ 
        message: "OTP sent successfully",
        email: user.email 
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      res.status(500).json({ message: "Failed to send OTP email" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Add OTP verification method
static async verifyOtp(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if OTP matches
    if (user.otp !== otp) {
      res.status(400).json({ message: "Invalid OTP" });
      return;
    }

    // Check if OTP is expired (10 minutes)
    const otpTime = parseInt(user.otpGeneratedTime || "0");
    const currentTime = Date.now();
    const timeDiff = currentTime - otpTime;
    const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds

    if (timeDiff > tenMinutes) {
      res.status(400).json({ message: "OTP has expired. Please request a new one." });
      return;
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = null;
    user.otpGeneratedTime = null;
    await user.save();

    res.status(200).json({ 
      message: "Email verified successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}
```

## 📁 **3. Update Routes**

### **SuperAdmin Routes** (`routes/superAdminRoute.ts`):

```typescript
// Add these routes to your existing superAdminRoute.ts

// Resend verification email for specific admin
router.post("/admins/:id/resend-verification", SuperAdminController.resendVerificationEmail);

// General resend verification endpoint
router.post("/resend-verification", SuperAdminController.resendVerificationEmail);
```

### **User Routes** (`routes/userRoute.ts`):

```typescript
// Add these routes to your existing userRoute.ts

// Resend OTP for email verification
router.post("/resend-otp", UserController.resendOtp);

// Verify OTP
router.post("/verify-otp", UserController.verifyOtp);
```

## 📁 **4. Update User Model**

Add these fields to your `models/userModel.ts`:

```typescript
// Add these fields to your User model
interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: string;
  isVerified: boolean;
  otp?: string;
  otpGeneratedTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

// If using Sequelize, add these to your model definition:
{
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  otp: {
    type: DataTypes.STRING(6),
    allowNull: true
  },
  otpGeneratedTime: {
    type: DataTypes.STRING(20),
    allowNull: true
  }
}
```

## 📁 **5. Database Migration**

Run these SQL commands to add the required fields:

```sql
-- Add OTP and verification fields to users table
ALTER TABLE users ADD COLUMN otp VARCHAR(6);
ALTER TABLE users ADD COLUMN otpGeneratedTime VARCHAR(20);
ALTER TABLE users ADD COLUMN isVerified BOOLEAN DEFAULT FALSE;

-- Update existing users to be verified (optional)
UPDATE users SET isVerified = TRUE WHERE isVerified IS NULL;
```

## 📁 **6. Install Required Packages**

Make sure you have these packages installed:

```bash
npm install otp-generator
```

## 📁 **7. Email Service Setup**

Ensure your email service is properly configured in `services/sendMail.ts`:

```typescript
// Example email service configuration
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendMail = async ({ to, subject, text, html }) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html
  };

  return transporter.sendMail(mailOptions);
};
```

## 🚀 **Testing the Implementation**

### **1. Test Super Admin Resend:**
```bash
# Test resend verification for specific admin
curl -X POST http://localhost:5001/api/super-admin/admins/123/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com"}'

# Test general resend verification
curl -X POST http://localhost:5001/api/super-admin/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com"}'
```

### **2. Test Auth Resend:**
```bash
# Test resend OTP
curl -X POST http://localhost:5001/api/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com"}'

# Test verify OTP
curl -X POST http://localhost:5001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "otp": "123456"}'
```

## ✅ **Expected Responses**

### **Success Responses:**
```json
{
  "message": "Verification email sent successfully",
  "email": "admin@example.com"
}
```

### **Error Responses:**
```json
{
  "message": "Admin not found or already verified"
}
```

## 🔄 **Frontend Integration**

Once backend is implemented:

1. **Super Admin Dashboard**: Resend verification will work
2. **Pending Verification Page**: Resend emails will work
3. **Email Verification Page**: OTP verification will work
4. **Admin Login**: Verified admins can login

## 📝 **Environment Variables**

Add these to your `.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

## 🎯 **Complete Workflow**

1. **Super Admin creates admin** → Admin gets pending status
2. **Admin receives email** → Gets verification OTP
3. **Admin verifies email** → Status changes to verified
4. **Admin can login** → Access admin panel
5. **Super Admin can resend** → If admin doesn't receive email

The frontend is already prepared and will automatically work once these backend endpoints are implemented! 