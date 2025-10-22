"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp,
  Shield,
  Activity
} from "lucide-react";
import { AdminStats } from "@/store/adminManagementSlice";

interface AdminStatsCardsProps {
  stats: AdminStats | null;
  loading: boolean;
}

export default function AdminStatsCards({ stats, loading }: AdminStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statsData = [
    {
      title: "Total Admins",
      value: stats.totalAdmins,
      icon: Shield,
      description: "All admin users",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Admins",
      value: stats.activeAdmins,
      icon: UserCheck,
      description: "Verified and active",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Inactive Admins",
      value: stats.inactiveAdmins,
      icon: UserX,
      description: "Pending verification",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers,
      icon: Users,
      description: `Admin ratio: ${stats.adminToCustomerRatio}`,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value.toLocaleString()}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  {stat.description}
                </p>
                {stat.title === "Active Admins" && stats.totalAdmins > 0 && (
                  <Badge 
                    variant={stats.activeAdmins / stats.totalAdmins >= 0.8 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {Math.round((stats.activeAdmins / stats.totalAdmins) * 100)}%
                  </Badge>
                )}
              </div>
            </CardContent>
            {/* Decorative gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-20"></div>
          </Card>
        );
      })}
    </div>
  );
}
