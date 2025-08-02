"use client";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, Package2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppDispatch } from "@/store/hooks";
import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/store/authSlice";
import store from "@/store/store";

export const description =
  "A login form with email and password. There's an option to login with Google and a link to sign up if you don't have an account.";

export default function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [data, setData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData({
      ...data,
      [name]: value,
    });
  };

  const handleSubmit = async(e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await dispatch(loginUser(data));
      console.log('Login result:', result);
      
      // Check if login was successful by looking at the status
      const currentStatus = store.getState().auth.status;
      console.log('Current auth status:', currentStatus);
      
      if (currentStatus === 'success') {
        // Get user data from Redux store
        const userData = store.getState().auth.user;
        console.log('User data from store:', userData);
        
        // Save user data to localStorage for role-based access
        if (userData && Array.isArray(userData) && userData.length > 0) {
          const user = userData[0];
          const userInfo = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role || 'admin',
            isVerified: true
          };
          localStorage.setItem("userData", JSON.stringify(userInfo));
          console.log('User data saved to localStorage:', userInfo);
        } else {
          // Fallback: create user data from login response
          const userInfo = {
            id: data.email, // Use email as ID if not available
            username: data.email.split('@')[0], // Use email prefix as username
            email: data.email,
            role: 'admin',
            isVerified: true
          };
          localStorage.setItem("userData", JSON.stringify(userInfo));
          console.log('Fallback user data saved:', userInfo);
        }
        
        setSuccess("Login successful! Redirecting...");
        console.log('Login successful, redirecting to dashboard...');
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        setError("Invalid email or password");
        console.log('Login failed, status:', currentStatus);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-4 shadow-lg">
            <Package2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            SHOEMART
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Admin Portal
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white">
              Admin Login
            </CardTitle>
            <CardDescription className="text-center text-slate-600 dark:text-slate-400">
              Sign in to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@shoemart.com"
                    value={data.email}
                    onChange={handleChange}
                    className="pl-10 h-12 bg-white/70 dark:bg-slate-700/70 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={data.password}
                    onChange={handleChange}
                    className="pl-10 pr-10 h-12 bg-white/70 dark:bg-slate-700/70 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In as Admin
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-800 px-2 text-slate-500 dark:text-slate-400">
                  Or
                </span>
              </div>
            </div>

            {/* Super Admin Login Link */}
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Super admin?{" "}
                <Link
                  href="/super-admin/login"
                  className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © 2024 SHOEMART. All rights reserved.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Admin Access Only
          </p>
        </div>
      </div>
    </div>
  );
}
