"use client";

import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  Shield,
  Mail,
  Calendar,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Admin } from "@/store/adminManagementSlice";

interface AdminManagementTableProps {
  admins: Admin[];
  loading: boolean;
  selectedAdmins: string[];
  onAdminSelect: (adminId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onEditAdmin: (admin: Admin) => void;
  onDemoteAdmin: (adminId: string) => void;
  onDeleteAdmin: (adminId: string) => void;
  onUpdateAdminStatus: (adminId: string, isVerified: boolean) => void;
}

export default function AdminManagementTable({
  admins,
  loading,
  selectedAdmins,
  onAdminSelect,
  onSelectAll,
  onEditAdmin,
  onDemoteAdmin,
  onDeleteAdmin,
  onUpdateAdminStatus,
}: AdminManagementTableProps) {
  const [hoveredAdmin, setHoveredAdmin] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'admin':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeVariant = (isVerified: boolean) => {
    return isVerified ? 'default' : 'secondary';
  };

  const allSelected = admins.length > 0 && selectedAdmins.length === admins.length;
  const someSelected = selectedAdmins.length > 0 && selectedAdmins.length < admins.length;

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="w-20 h-6 bg-gray-200 rounded"></div>
            <div className="w-20 h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (admins.length === 0) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No admins found</h3>
        <p className="text-gray-500">Get started by creating your first admin user.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {admins.map((admin) => (
            <TableRow
              key={admin.id}
              className={`cursor-pointer transition-colors ${
                selectedAdmins.includes(admin.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onMouseEnter={() => setHoveredAdmin(admin.id)}
              onMouseLeave={() => setHoveredAdmin(null)}
            >
              <TableCell>
                <Checkbox
                  checked={selectedAdmins.includes(admin.id)}
                  onCheckedChange={() => onAdminSelect(admin.id)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {admin.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{admin.username}</div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {admin.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(admin.role)}>
                  {admin.role === 'super_admin' ? 'Super Admin' : 
                   admin.role === 'admin' ? 'Admin' : admin.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(admin.isVerified)}>
                  {admin.isVerified ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(admin.createdAt)}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditAdmin(admin)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onUpdateAdminStatus(admin.id, !admin.isVerified)}
                    >
                      {admin.isVerified ? (
                        <>
                          <UserX className="w-4 h-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDemoteAdmin(admin.id)}
                      className="text-orange-600"
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Demote to Customer
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDeleteAdmin(admin.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Admin
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
