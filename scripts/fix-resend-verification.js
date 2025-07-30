// Backend Endpoints for Resend Verification
// Add these endpoints to your backend to fix resend email functionality

/*
1. Add to your backend routes (e.g., superAdminRoute.ts):

// Resend verification email for specific admin
router.post("/admins/:id/resend-verification", SuperAdminController.resendVerificationEmail);

// General resend verification endpoint
router.post("/resend-verification", SuperAdminController.resendVerificationEmail);

2. Add to your SuperAdminController:

static async resendVerificationEmail(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { email } = req.body;

    // Find the admin
    const admin = await User.findOne({ 
      where: { 
        id: id || email, 
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

3. Add to your auth routes (e.g., userRoute.ts):

// Resend OTP for email verification
router.post("/resend-otp", UserController.resendOtp);

4. Add to your UserController:

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

5. Add OTP verification endpoint:

router.post("/verify-otp", UserController.verifyOtp);

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

6. Update your User model to include OTP fields:

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

7. Database migration (if needed):

ALTER TABLE users ADD COLUMN otp VARCHAR(6);
ALTER TABLE users ADD COLUMN otpGeneratedTime VARCHAR(20);
ALTER TABLE users ADD COLUMN isVerified BOOLEAN DEFAULT FALSE;
*/

console.log("Backend endpoints for resend verification have been documented.");
console.log("Please add these endpoints to your backend to fix the resend email functionality."); 