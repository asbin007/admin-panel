"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  Crown, 
  ExternalLink, 
  ChevronDown,
  LogOut,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface RoleSwitcherProps {
  currentRole?: string;
  currentUser?: any;
  onLogout?: () => void;
}

export default function RoleSwitcher({ currentRole, currentUser, onLogout }: RoleSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleRoleSwitch = (role: string) => {
    switch (role) {
      case 'super_admin':
        router.push('/super-admin/dashboard');
        break;
      case 'admin':
        router.push('/dashboard');
        break;
      default:
        break;
    }
    setIsOpen(false);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("tokenauth");
      localStorage.removeItem("userData");
      router.push('/user/login');
    }
    setIsOpen(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <UserCheck className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-gradient-to-r from-purple-500 to-indigo-600';
      case 'admin':
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
      default:
        return 'bg-gradient-to-r from-slate-500 to-slate-600';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      default:
        return 'User';
    }
  };

  return (
    <div className="relative">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className={`h-10 px-4 ${getRoleColor(currentRole || 'user')} text-white border-0 hover:opacity-90 transition-all duration-200`}
          >
            <div className="flex items-center space-x-2">
              {getRoleIcon(currentRole || 'user')}
              <span className="font-medium">{getRoleLabel(currentRole || 'user')}</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64 p-2">
          {/* Current User Info */}
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {currentUser?.username || 'User'}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {currentUser?.email || 'user@example.com'}
            </p>
            <Badge 
              variant="secondary" 
              className={`mt-1 ${getRoleColor(currentRole || 'user')} text-white text-xs`}
            >
              {getRoleLabel(currentRole || 'user')}
            </Badge>
          </div>

          {/* Role Switching Options */}
          <div className="py-2">
            <p className="px-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Switch Role
            </p>
            
            {/* Super Admin Option */}
            {currentRole !== 'super_admin' && (
              <DropdownMenuItem 
                onClick={() => handleRoleSwitch('super_admin')}
                className="flex items-center space-x-3 px-3 py-2 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20"
              >
                <Crown className="h-4 w-4 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Super Admin
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Full system access
                  </p>
                </div>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </DropdownMenuItem>
            )}

            {/* Admin Option */}
            {currentRole !== 'admin' && (
              <DropdownMenuItem 
                onClick={() => handleRoleSwitch('admin')}
                className="flex items-center space-x-3 px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Shield className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Admin Panel
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Manage orders, products, users
                  </p>
                </div>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </DropdownMenuItem>
            )}

          </div>

          <DropdownMenuSeparator />

          {/* Logout Option */}
          <DropdownMenuItem 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
