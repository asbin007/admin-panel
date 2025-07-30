"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Shield, 
  BarChart3, 
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

interface Admin {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  isVerified?: boolean;
}

interface SystemStats {
  totalUsers: number;
  totalAdmins: number;
  totalSuperAdmins: number;
  totalAccounts: number;
}

export default function SuperAdminDashboard() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAdmins();
    fetchStats();
  }, []);

  const fetchAdmins = async () => {
    try {
      const { APIS } = await import("@/globals/http");
      const response = await APIS.get("/super-admin/admins");
      
      if (response.status === 200) {
        setAdmins(response.data.admins || []);
      }
    } catch (error: any) {
      console.error("Error fetching admins:", error);
      setError("Failed to load admins");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { APIS } = await import("@/globals/http");
      const response = await APIS.get("/super-admin/stats");
      
      if (response.status === 200) {
        setStats(response.data.stats);
      }
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    }
  };



  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm("Are you sure you want to delete this admin?")) return;

    try {
      const { APIS } = await import("@/globals/http");
      const response = await APIS.delete(`/super-admin/admins/${adminId}`);
      
      if (response.status === 200) {
        fetchAdmins(); // Refresh list
        fetchStats(); // Refresh stats
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to delete admin");
    }
  };

  const handleResetPassword = async () => {
    if (!selectedAdmin || !newPassword) {
      setError("Please enter a new password");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { APIS } = await import("@/globals/http");
      const response = await APIS.put(`/super-admin/admins/${selectedAdmin.id}/reset-password`, {
        newPassword
      });
      
      if (response.status === 200) {
        setShowResetDialog(false);
        setSelectedAdmin(null);
        setNewPassword("");
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Super Admin Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage all system administrators and view statistics
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Users</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalUsers}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Admins</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalAdmins}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Super Admins</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalSuperAdmins}</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Accounts</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalAccounts}</p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending Verification</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{admins.filter(admin => !admin.isVerified).length}</p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <RefreshCw className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Admin Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions Card */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/super-admin/admins/create">
                <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create New Admin
                </Button>
              </Link>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Admins</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    {admins.length}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active Admins</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    {admins.filter(admin => admin.isVerified).length}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Pending Verification</span>
                  </div>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                    {admins.filter(admin => !admin.isVerified).length}
                  </Badge>
                </div>
                
                <Link href="/super-admin/admins/pending">
                  <Button variant="outline" size="sm" className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    View Pending
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Admin List Card */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                    Admin List
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Manage all system administrators
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search admins by name or email..."
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
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                      {searchTerm ? "No admins found matching your search" : "No admins found"}
                    </p>
                  </div>
                ) : (
                  filteredAdmins.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-700/50 rounded-xl border border-slate-200/50 dark:border-slate-600/50 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                            {admin.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {admin.username}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {admin.role}
                            </Badge>
                            {admin.isVerified ? (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
                                Pending
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {admin.email}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            Created: {formatDate(admin.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setShowResetDialog(true);
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Reset Password
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
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

        {/* Password Reset Dialog */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Admin Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Reset password for <strong>{selectedAdmin?.username}</strong>
              </p>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleResetPassword} 
                  disabled={isSubmitting || !newPassword}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowResetDialog(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 