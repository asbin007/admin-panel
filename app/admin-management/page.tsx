"use client";

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchAdmins,
  fetchAdminStats,
  createAdmin,
  updateAdmin,
  promoteToAdmin,
  demoteAdmin,
  deleteAdmin,
  bulkUpdateAdmins,
  setSearchQuery,
  setStatusFilter,
  setSelectedAdmins,
  toggleAdminSelection,
  clearSelectedAdmins,
  type Admin
} from '@/store/adminManagementSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserMinus,
  Shield,
  ShieldCheck,
  ShieldX,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import toast from 'react-hot-toast';

export default function AdminManagementPage() {
  const dispatch = useAppDispatch();
  const { 
    admins, 
    stats, 
    pagination, 
    loading, 
    error, 
    searchQuery, 
    statusFilter, 
    selectedAdmins 
  } = useAppSelector((state) => state.adminManagement);
  
  const { user } = useAppSelector((state) => state.auth);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [deleteAdminId, setDeleteAdminId] = useState<string | null>(null);
  const [promoteUserId, setPromoteUserId] = useState('');
  
  // Form states
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    isVerified: false
  });
  
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    isVerified: false,
    password: ''
  });

  // Check if user is super admin
  const isSuperAdmin = user?.[0]?.role === 'super_admin';

  useEffect(() => {
    if (isSuperAdmin) {
      dispatch(fetchAdmins({ page: currentPage, search: searchQuery, status: statusFilter }));
      dispatch(fetchAdminStats());
    }
  }, [dispatch, currentPage, searchQuery, statusFilter, isSuperAdmin]);

  const handleSearch = (value: string) => {
    dispatch(setSearchQuery(value));
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    dispatch(setStatusFilter(value as 'all' | 'active' | 'inactive'));
    setCurrentPage(1);
  };

  const handleCreateAdmin = async () => {
    try {
      await dispatch(createAdmin(createForm)).unwrap();
      toast.success('Admin created successfully');
      setIsCreateDialogOpen(false);
      setCreateForm({ username: '', email: '', password: '', isVerified: false });
      dispatch(fetchAdmins({ page: currentPage, search: searchQuery, status: statusFilter }));
    } catch (error: any) {
      toast.error(error || 'Failed to create admin');
    }
  };

  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return;
    
    try {
      const updateData = {
        username: editForm.username,
        email: editForm.email,
        isVerified: editForm.isVerified
      };
      
      if (editForm.password) {
        updateData.password = editForm.password;
      }
      
      await dispatch(updateAdmin({ id: selectedAdmin.id, adminData: updateData })).unwrap();
      toast.success('Admin updated successfully');
      setIsEditDialogOpen(false);
      setSelectedAdmin(null);
      dispatch(fetchAdmins({ page: currentPage, search: searchQuery, status: statusFilter }));
    } catch (error: any) {
      toast.error(error || 'Failed to update admin');
    }
  };

  const handlePromoteUser = async () => {
    if (!promoteUserId) return;
    
    try {
      await dispatch(promoteToAdmin(promoteUserId)).unwrap();
      toast.success('User promoted to admin successfully');
      setIsPromoteDialogOpen(false);
      setPromoteUserId('');
      dispatch(fetchAdmins({ page: currentPage, search: searchQuery, status: statusFilter }));
    } catch (error: any) {
      toast.error(error || 'Failed to promote user');
    }
  };

  const handleDemoteAdmin = async (adminId: string) => {
    try {
      await dispatch(demoteAdmin(adminId)).unwrap();
      toast.success('Admin demoted to customer successfully');
      dispatch(fetchAdmins({ page: currentPage, search: searchQuery, status: statusFilter }));
    } catch (error: any) {
      toast.error(error || 'Failed to demote admin');
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deleteAdminId) return;
    
    try {
      await dispatch(deleteAdmin(deleteAdminId)).unwrap();
      toast.success('Admin deleted successfully');
      setDeleteAdminId(null);
      dispatch(fetchAdmins({ page: currentPage, search: searchQuery, status: statusFilter }));
    } catch (error: any) {
      toast.error(error || 'Failed to delete admin');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedAdmins.length === 0) {
      toast.error('Please select admins first');
      return;
    }
    
    try {
      await dispatch(bulkUpdateAdmins({ adminIds: selectedAdmins, action })).unwrap();
      toast.success(`Bulk ${action} completed successfully`);
      dispatch(clearSelectedAdmins());
      dispatch(fetchAdmins({ page: currentPage, search: searchQuery, status: statusFilter }));
    } catch (error: any) {
      toast.error(error || `Failed to perform bulk ${action}`);
    }
  };

  const handleSelectAll = () => {
    if (selectedAdmins.length === admins.length) {
      dispatch(clearSelectedAdmins());
    } else {
      dispatch(setSelectedAdmins(admins.map(admin => admin.id)));
    }
  };

  const openEditDialog = (admin: Admin) => {
    setSelectedAdmin(admin);
    setEditForm({
      username: admin.username,
      email: admin.email,
      isVerified: admin.isVerified,
      password: ''
    });
    setIsEditDialogOpen(true);
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <ShieldX className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600">You need super admin privileges to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600">Manage admin users and permissions</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Create Admin
          </Button>
          <Button variant="outline" onClick={() => setIsPromoteDialogOpen(true)}>
            <Shield className="h-4 w-4 mr-2" />
            Promote User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAdmins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeAdmins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Admins</CardTitle>
              <ShieldX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.inactiveAdmins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Ratio</CardTitle>
              <Shield className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.adminToCustomerRatio}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search admins..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedAdmins.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedAdmins.length} admin(s) selected
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('activate')}
                >
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('deactivate')}
                >
                  Deactivate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('demote')}
                >
                  Demote
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => dispatch(clearSelectedAdmins())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admins ({pagination?.totalAdmins || 0})</CardTitle>
          <CardDescription>Manage admin users and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg font-medium text-sm text-gray-600">
                <div className="col-span-1">
                  <Checkbox
                    checked={selectedAdmins.length === admins.length && admins.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </div>
                <div className="col-span-3">Name</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Created</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Table Rows */}
              {admins.map((admin) => (
                <div key={admin.id} className="grid grid-cols-12 gap-4 p-4 border rounded-lg hover:bg-gray-50">
                  <div className="col-span-1">
                    <Checkbox
                      checked={selectedAdmins.includes(admin.id)}
                      onCheckedChange={() => dispatch(toggleAdminSelection(admin.id))}
                    />
                  </div>
                  <div className="col-span-3">
                    <div className="font-medium">{admin.username}</div>
                  </div>
                  <div className="col-span-3">
                    <div className="text-gray-600">{admin.email}</div>
                  </div>
                  <div className="col-span-2">
                    <Badge variant={admin.isVerified ? "default" : "secondary"}>
                      {admin.isVerified ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-500">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(admin)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDemoteAdmin(admin.id)}
                          className="text-orange-600"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Demote
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteAdminId(admin.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}

              {admins.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No admins found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.totalAdmins)} of {pagination.totalAdmins} admins
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagination.hasPrev}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!pagination.hasNext}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Admin Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Admin</DialogTitle>
            <DialogDescription>
              Create a new admin user with the specified credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-username">Username</Label>
              <Input
                id="create-username"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div>
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="create-verified"
                checked={createForm.isVerified}
                onCheckedChange={(checked) => setCreateForm({ ...createForm, isVerified: !!checked })}
              />
              <Label htmlFor="create-verified">Verified (Active)</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAdmin} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Admin
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>
              Update admin information and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div>
              <Label htmlFor="edit-password">New Password (optional)</Label>
              <Input
                id="edit-password"
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-verified"
                checked={editForm.isVerified}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isVerified: !!checked })}
              />
              <Label htmlFor="edit-verified">Verified (Active)</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAdmin} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Admin
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Promote User Dialog */}
      <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote User to Admin</DialogTitle>
            <DialogDescription>
              Enter the user ID to promote them to admin status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="promote-user-id">User ID</Label>
              <Input
                id="promote-user-id"
                value={promoteUserId}
                onChange={(e) => setPromoteUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsPromoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePromoteUser} disabled={loading || !promoteUserId}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Promote User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAdminId} onOpenChange={() => setDeleteAdminId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this admin? This action will demote them to customer status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAdmin} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
