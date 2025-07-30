"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  RefreshCw, 
  ArrowLeft, 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { APIS } from "@/globals/http";

interface PendingAdmin {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  otpGeneratedTime?: string;
  isVerified: boolean;
}

export default function PendingVerificationPage() {
  const [pendingAdmins, setPendingAdmins] = useState<PendingAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchPendingAdmins();
  }, []);

  const fetchPendingAdmins = async () => {
    try {
      const response = await APIS.get("/super-admin/admins");
      
      if (response.status === 200) {
        // Filter only pending admins
        const pending = response.data.admins.filter((admin: PendingAdmin) => !admin.isVerified);
        setPendingAdmins(pending);
      }
    } catch (error: any) {
      console.error("Error fetching pending admins:", error);
      setError("Failed to load pending admins");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async (adminId: string, email: string) => {
    setResendingEmail(adminId);
    setError("");
    setSuccess("");

    try {
      // Try multiple endpoints for resend verification
      let response;
      
      try {
        // First try the specific resend endpoint
        response = await APIS.post(`/super-admin/admins/${adminId}/resend-verification`, {
          email: email
        });
      } catch (firstError) {
        try {
          // If that fails, try the general resend endpoint
          response = await APIS.post(`/auth/resend-otp`, {
            email: email
          });
        } catch (secondError) {
          // If both fail, try recreating the admin
          response = await APIS.put(`/super-admin/admins/${adminId}`, {
            email: email,
            resendVerification: true
          });
        }
      }

      if (response.status === 200 || response.status === 201) {
        setSuccess("Verification email sent successfully! Check the admin's email.");
        setTimeout(() => setSuccess(""), 5000);
      }
    } catch (error: any) {
      console.error("Error resending verification:", error);
      
      // Provide helpful error message
      if (error.response?.status === 404) {
        setError("Admin not found. Please refresh the page.");
      } else if (error.response?.status === 400) {
        setError("Invalid email address. Please check the email format.");
      } else if (error.response?.status === 429) {
        setError("Too many requests. Please wait a few minutes before trying again.");
      } else {
        setError("Failed to resend verification email. Please try again later.");
      }
      
      setTimeout(() => setError(""), 8000);
    } finally {
      setResendingEmail(null);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm("Are you sure you want to delete this pending admin?")) return;

    try {
      const response = await APIS.delete(`/super-admin/admins/${adminId}`);
      
      if (response.status === 200) {
        setSuccess("Admin deleted successfully!");
        fetchPendingAdmins(); // Refresh list
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error: any) {
      console.error("Error deleting admin:", error);
      setError(error.response?.data?.message || "Failed to delete admin");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleVerifyAdmin = async (adminId: string, email: string) => {
    if (!confirm("Are you sure you want to verify this admin? They will be able to login immediately.")) return;

    try {
      const response = await APIS.put(`/super-admin/admins/${adminId}/verify`, {
        email: email
      });
      
      if (response.status === 200) {
        setSuccess("Admin verified successfully! They can now login.");
        // Remove the verified admin from the current list immediately
        setPendingAdmins(prev => prev.filter(admin => admin.id !== adminId));
        // Force refresh the list after a short delay
        setTimeout(() => {
          fetchPendingAdmins();
        }, 1000);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error: any) {
      console.error("Error verifying admin:", error);
      setError(error.response?.data?.message || "Failed to verify admin");
      setTimeout(() => setError(""), 5000);
    }
  };

  const filteredAdmins = pendingAdmins.filter(admin =>
    admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSinceCreation = (dateString: string) => {
    const created = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just created";
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600 dark:text-slate-400">Loading pending verifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/super-admin/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-600 to-red-700 rounded-xl">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Pending Verification
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage admins waiting for email verification
              </p>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Card */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Pending</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingAdmins.length}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Emails Sent</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingAdmins.length}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Ready to Verify</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingAdmins.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Admins List */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  Pending Admins
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Admins waiting for email verification
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchPendingAdmins}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setPendingAdmins([]);
                    setTimeout(() => fetchPendingAdmins(), 100);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Force Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search pending admins..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Admins List */}
            <div className="space-y-4">
              {filteredAdmins.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    No Pending Verifications
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    {searchTerm ? "No admins found matching your search" : "All admins have been verified"}
                  </p>
                  {!searchTerm && (
                    <Link href="/super-admin/admins/create">
                      <Button className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800">
                        Create New Admin
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                filteredAdmins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-6 bg-white/50 dark:bg-slate-700/50 rounded-xl border border-slate-200/50 dark:border-slate-600/50 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white font-semibold">
                          {admin.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {admin.username}
                          </h3>
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
                            Pending
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                          {admin.email}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          Created: {formatDate(admin.createdAt)} ({getTimeSinceCreation(admin.createdAt)})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerifyAdmin(admin.id, admin.email)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Verify Admin
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendVerification(admin.id, admin.email)}
                        disabled={resendingEmail === admin.id}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      >
                        {resendingEmail === admin.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-1" />
                            Resend Email
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 