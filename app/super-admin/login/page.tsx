"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, Package2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { APIS } from "@/globals/http";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "super@gmail.com",
    password: "12345678"
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await APIS.post("/auth/super-admin/login", formData);

      if (response.status === 200) {
        const { token, user } = response.data;
        
        // Store token and user data
        localStorage.setItem("tokenauth", token);
        localStorage.setItem("userData", JSON.stringify(user));
        
        setSuccess("Super admin login successful! Redirecting...");
        
        // Redirect to super admin dashboard
        setTimeout(() => {
          router.push("/super-admin/dashboard");
        }, 1500);
      }
    } catch (error: any) {
      console.error("Super admin login error:", error);
      setError(error.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl mb-4 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            SHOEMART
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Super Admin Portal
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white">
              Super Admin Login
            </CardTitle>
            <CardDescription className="text-center text-slate-600 dark:text-slate-400">
              Access the super admin dashboard
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
                    placeholder="superadmin@shoemart.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 h-12 bg-white/70 dark:bg-slate-700/70 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
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
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10 h-12 bg-white/70 dark:bg-slate-700/70 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
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
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In as Super Admin
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

            {/* Other Login Links */}
            <div className="text-center space-y-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Regular admin?{" "}
                <Link
                  href="/user/login"
                  className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Admin Login
                </Link>
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Need admin account?{" "}
                <Link
                  href="/admin-register"
                  className="font-semibold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                >
                  Create Admin Account
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
            Super Admin Access Only
          </p>
        </div>
      </div>
    </div>
  );
}
