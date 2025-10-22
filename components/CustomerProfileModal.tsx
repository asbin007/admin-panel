"use client";

import { useState } from "react";
import { X, User, Mail, Star, Calendar, Package, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerInfo: {
    username: string;
    userId: string;
    email?: string;
    reviewCount: number;
    averageRating: number;
    lastReviewDate: string;
    productReviewed: string;
    reviewId: string;
    productId: string;
  };
  onStartChat: () => void;
}

export default function CustomerProfileModal({
  isOpen,
  onClose,
  customerInfo,
  onStartChat
}: CustomerProfileModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-slate-800 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
              Customer Profile
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Customer Avatar and Basic Info */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${customerInfo.username}`} 
              />
              <AvatarFallback className="text-lg font-semibold">
                {customerInfo.username.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {customerInfo.username}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                User ID: {customerInfo.userId}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  Customer
                </Badge>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <Mail className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600 dark:text-slate-400">
                {customerInfo.email || 'Email not available'}
              </span>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <Star className="h-4 w-4 text-slate-500" />
              <div className="flex items-center gap-1">
                {renderStars(customerInfo.averageRating)}
                <span className="ml-2 text-slate-600 dark:text-slate-400">
                  {customerInfo.averageRating.toFixed(1)}/5 ({customerInfo.reviewCount} reviews)
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600 dark:text-slate-400">
                Last review: {formatDate(customerInfo.lastReviewDate)}
              </span>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <Package className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600 dark:text-slate-400">
                Reviewed: {customerInfo.productReviewed}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              onClick={onStartChat}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Chat
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              Close
            </Button>
          </div>

          {/* Additional Info */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              💡 <strong>Tip:</strong> You can start a conversation with this customer to discuss their review or provide support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
