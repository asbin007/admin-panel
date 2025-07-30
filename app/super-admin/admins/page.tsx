"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Trash2, 
  Edit, 
  Shield, 
  RefreshCw,
  Plus,
  Search,
  Filter,
  Mail,
  Calendar,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Admin {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  isVerified?: boolean;
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [newAdmin, setNewAdmin] = useState({
    username: "",
    email: "",
    password: ""
  });
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAdmins();
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

  const handleCreateAdmin = async () => {
    if (!newAdmin.username || !newAdmin.email || !newAdmin.password) {
      setError("All fields are required");
      return;
    }

    if (newAdmin.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { APIS } = await import("@/globals/http");
      const response = await APIS.post("/super-admin/admins", newAdmin);
      
      if (response.status === 201) {
        setSuccess("Admin created successfully! Verification email sent.");
        setShowCreateDialog(false);
        setNewAdmin({ username: "", email: "", password: "" });
        fetchAdmins();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to create admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm("Are you sure you want to delete this admin? This action cannot be undone.")) return;

    try {
      const { APIS } = await import("@/globals/http");
      const response = await APIS.delete(`/super-admin/admins/${adminId}`);
      
      if (response.status === 200) {
        setSuccess("Admin deleted successfully");
        fetchAdmins();
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

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
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
        setSuccess("Password reset successfully");
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600 dark:text-slate-400">Loading admins...</p>
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
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Admin Management
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Create, view, and manage system administrators
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20">
            <AlertDescription className="text-green-800 dark:text-green-200">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Admin Management Card */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                  System Administrators
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  {filteredAdmins.length} admin{filteredAdmins.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Admin</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={newAdmin.username}
                        onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                        placeholder="Enter username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                        placeholder="Enter email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={newAdmin.password}
                          onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                          placeholder="Enter password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-slate-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-slate-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleCreateAdmin} 
                        disabled={isSubmitting}
                        className="flex-1"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            Creating...
                          </>
                        ) : (
                          "Create Admin"
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowCreateDialog(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search admins by username or email..."
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

            {/* Admins Table */}
            <div className="rounded-lg border border-slate-200/50 dark:border-slate-600/50 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-700/50">
                  <TableRow>
                    <TableHead className="font-semibold">Admin</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600 dark:text-slate-400">
                          {searchTerm ? "No admins found matching your search" : "No admins found"}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdmins.map((admin) => (
                      <TableRow key={admin.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="" />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs">
                                {admin.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {admin.username}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-700 dark:text-slate-300">
                              {admin.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            {admin.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-700 dark:text-slate-300">
                              {formatDate(admin.createdAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={admin.isVerified ? "default" : "secondary"}>
                            {admin.isVerified ? "Verified" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedAdmin(admin);
                                setShowResetDialog(true);
                              }}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Reset
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAdmin(admin.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Reset Password Dialog */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Password for {selectedAdmin?.username}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleResetPassword} 
                  disabled={isSubmitting}
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