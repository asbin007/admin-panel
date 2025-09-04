"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  ArrowRight,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { API } from "@/globals/http";

export default function EmailVerificationPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if token is in URL (for email link verification)
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');
    
    if (token && emailParam) {
      handleEmailLinkVerification(token, emailParam);
    }
  }, [searchParams]);

  const handleEmailLinkVerification = async (token: string, email: string) => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await API.get(`/auth/verify-email?token=${token}&email=${email}`);
      
      if (response.status === 200) {
        setSuccess("Email verified successfully! You can now login.");
        setIsVerified(true);
        setTimeout(() => {
          router.push("/user/login");
        }, 3000);
      }
    } catch (error: unknown) {
      console.error("Email verification error:", error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : "Email verification failed. Please try again.";
      setError(errorMessage || "Email verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Try multiple endpoints for resend OTP
      let response;
      
      try {
        // First try the auth resend endpoint
        response = await API.post("/auth/resend-otp", { email });
      } catch {
        try {
          // If that fails, try the super admin resend endpoint
          response = await API.post("/super-admin/resend-verification", { email });
        } catch {
          // If both fail, try the general verification endpoint
          response = await API.post("/auth/verification/resend", { email });
        }
      }
      
      if (response.status === 200 || response.status === 201) {
        setSuccess("Verification code sent successfully! Check your email.");
        setShowOtpForm(true);
        setTimeout(() => setSuccess(""), 5000);
      }
    } catch (error: unknown) {
      console.error("Resend OTP error:", error);
      
      // Provide helpful error message
      const errorResponse = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { status?: number } }).response 
        : null;
        
      if (errorResponse?.status === 404) {
        setError("Email not found. Please check your email address.");
      } else if (errorResponse?.status === 400) {
        setError("Invalid email address. Please check the email format.");
      } else if (errorResponse?.status === 429) {
        setError("Too many requests. Please wait a few minutes before trying again.");
      } else {
        setError("Failed to send verification code. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !otp) {
      setError("Please enter both email and OTP");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await API.post("/auth/verify-otp", { email, otp });
      
      if (response.status === 200) {
        setSuccess("Email verified successfully! You can now login.");
        setIsVerified(true);
        setTimeout(() => {
          router.push("/user/login");
        }, 3000);
      }
    } catch (error: unknown) {
      console.error("OTP verification error:", error);
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : "Invalid OTP. Please try again.";
      setError(errorMessage || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 dark:from-slate-900 dark:to-green-900/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Email Verified!
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Your email has been successfully verified. You can now login to your admin account.
                </p>
              </div>
              <Button 
                onClick={() => router.push("/user/login")}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-4 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            SHOEMART
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Email Verification
          </p>
        </div>

        {/* Verification Card */}
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-center text-slate-600 dark:text-slate-400">
              Complete your admin account verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Success Alert */}
            {success && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* OTP Form */}
            {showOtpForm && (
              <form onSubmit={handleOtpVerification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Verification Code (OTP)
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="h-12 text-center text-lg font-mono tracking-widest"
                    maxLength={6}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify Email
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Resend OTP Button */}
            {!showOtpForm && (
              <Button
                onClick={handleResendOtp}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Verification Code
                  </>
                )}
              </Button>
            )}

            {/* Back to Login */}
            <div className="text-center">
              <Button
                variant="link"
                onClick={() => router.push("/user/login")}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  How to verify your email
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Check your email for the verification code</li>
                  <li>• Enter the 6-digit OTP in the field above</li>
                  <li>• Click &quot;Verify Email&quot; to complete verification</li>
                  <li>• You can then login to your admin account</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 