"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import OrderTimeline from './OrderTimeline';

interface OrderStatusManagerProps {
  orderId: string;
  currentStatus: string;
  paymentStatus: string;
  onStatusChange: (newStatus: string) => Promise<{ success: boolean; error?: string }>;
  onPaymentStatusChange: (newPaymentStatus: string) => Promise<{ success: boolean; error?: string }>;
  isAdmin?: boolean;
  // Real-time update props
  onRefresh?: () => void;
}

const OrderStatusManager: React.FC<OrderStatusManagerProps> = ({
  orderId,
  currentStatus,
  paymentStatus,
  onStatusChange,
  onPaymentStatusChange,
  isAdmin = true,
  onRefresh
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRealTimeUpdating, setIsRealTimeUpdating] = useState(false);
  const [localOrderStatus, setLocalOrderStatus] = useState(currentStatus);
  const [localPaymentStatus, setLocalPaymentStatus] = useState(paymentStatus);

  // Sync local state with props
  useEffect(() => {
    setLocalOrderStatus(currentStatus);
    setLocalPaymentStatus(paymentStatus);
  }, [currentStatus, paymentStatus]);

  // Real-time WebSocket listeners for order updates
  useEffect(() => {
    console.log('🔍 OrderStatusManager: Setting up WebSocket listeners for order:', orderId);
    
    if (typeof window !== 'undefined' && (window as any).socket) {
      const socket = (window as any).socket;
      
      console.log('🔍 OrderStatusManager: Socket found:', !!socket);
      console.log('🔍 OrderStatusManager: Socket connected:', socket.connected);
      console.log('🔍 OrderStatusManager: Socket ID:', socket.id);
      
      const handleOrderStatusUpdate = (data: any) => {
        console.log('🔄 OrderStatusManager: Real-time order status update received:', data);
        console.log('🔄 OrderStatusManager: Received orderId:', data.orderId, 'Current orderId:', orderId);
        if (data.orderId === orderId) {
          console.log('🔄 OrderStatusManager: Refreshing order data for order:', orderId);
          setIsRealTimeUpdating(true);
          if (onRefresh) {
            onRefresh();
          }
          // Clear real-time updating state after a short delay
          setTimeout(() => setIsRealTimeUpdating(false), 2000);
        }
      };

      const handlePaymentStatusUpdate = (data: any) => {
        console.log('💰 OrderStatusManager: Real-time payment status update received:', data);
        console.log('💰 OrderStatusManager: Received orderId:', data.orderId, 'Current orderId:', orderId);
        if (data.orderId === orderId) {
          console.log('💰 OrderStatusManager: Refreshing order data for order:', orderId);
          setIsRealTimeUpdating(true);
          if (onRefresh) {
            onRefresh();
          }
          // Clear real-time updating state after a short delay
          setTimeout(() => setIsRealTimeUpdating(false), 2000);
        }
      };

      // Listen for order status updates
      console.log('🔍 OrderStatusManager: Adding WebSocket listeners...');
      socket.on('orderStatusUpdated', handleOrderStatusUpdate);
      socket.on('statusUpdated', handleOrderStatusUpdate);
      socket.on('paymentStatusUpdated', handlePaymentStatusUpdate);
      
      // Test WebSocket connection
      socket.emit('test', { message: 'OrderStatusManager connected', orderId });

      return () => {
        console.log('🔍 OrderStatusManager: Cleaning up WebSocket listeners...');
        socket.off('orderStatusUpdated', handleOrderStatusUpdate);
        socket.off('statusUpdated', handleOrderStatusUpdate);
        socket.off('paymentStatusUpdated', handlePaymentStatusUpdate);
      };
    } else {
      console.warn('⚠️ OrderStatusManager: WebSocket not available');
    }
  }, [orderId, onRefresh]);

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-gray-500' },
    { value: 'preparation', label: 'Preparation', color: 'bg-blue-500' },
    { value: 'ontheway', label: 'On the Way', color: 'bg-yellow-500' },
    { value: 'delivered', label: 'Delivered', color: 'bg-green-500' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' }
  ];

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === localOrderStatus || !localOrderStatus) return;

    setIsUpdating(true);
    setUpdateMessage(null);

    try {
      const result = await onStatusChange(newStatus);
      
      if (result.success) {
        setLocalOrderStatus(newStatus);
        setUpdateMessage({ type: 'success', text: `Order status updated to ${newStatus}` });
      } else {
        setUpdateMessage({ type: 'error', text: result.error || 'Failed to update status' });
      }
    } catch (error) {
      setUpdateMessage({ type: 'error', text: 'An error occurred while updating status' });
    } finally {
      setIsUpdating(false);
      // Clear message after 3 seconds
      setTimeout(() => setUpdateMessage(null), 3000);
    }
  };

  const handlePaymentStatusToggle = async (checked: boolean) => {
    const newPaymentStatus = checked ? 'paid' : 'unpaid';
    
    if (newPaymentStatus === localPaymentStatus) return;

    setIsUpdating(true);
    setUpdateMessage(null);

    try {
      const result = await onPaymentStatusChange(newPaymentStatus);
      
      if (result.success) {
        setLocalPaymentStatus(newPaymentStatus);
        setUpdateMessage({ type: 'success', text: `Payment status updated to ${newPaymentStatus}` });
      } else {
        setUpdateMessage({ type: 'error', text: result.error || 'Failed to update payment status' });
      }
    } catch (error) {
      setUpdateMessage({ type: 'error', text: 'An error occurred while updating payment status' });
    } finally {
      setIsUpdating(false);
      // Clear message after 3 seconds
      setTimeout(() => setUpdateMessage(null), 3000);
    }
  };

  const getStatusColor = (status: string) => {
    if (!status || typeof status !== 'string') return 'bg-gray-500';
    const option = statusOptions.find(opt => opt.value === status);
    return option?.color || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Timeline View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(currentStatus)}`}></div>
              Order Status Timeline
              {isRealTimeUpdating && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </div>
              )}
            </div>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  onRefresh();
                }}
                className="text-xs"
              >
                <Loader2 className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTimeline 
            currentStatus={localOrderStatus}
            onStatusChange={isAdmin ? handleStatusUpdate : undefined}
            isAdmin={isAdmin}
            orderId={orderId}
            onRefresh={onRefresh}
          />
        </CardContent>
      </Card>

      {/* Status Management Controls */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Status Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Status Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Order Status</label>
              <div className="flex items-center gap-3">
                <Select 
                  value={localOrderStatus} 
                  onValueChange={handleStatusUpdate}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${option.color}`}></div>
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
            </div>

            {/* Payment Status Toggle */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Status</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="payment-status"
                    checked={localPaymentStatus === 'paid'}
                    onCheckedChange={handlePaymentStatusToggle}
                    disabled={isUpdating}
                  />
                  <label htmlFor="payment-status" className="text-sm">
                    {localPaymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                  </label>
                </div>
                
                <Badge 
                  variant={localPaymentStatus === 'paid' ? 'default' : 'destructive'}
                  className={localPaymentStatus === 'paid' ? 'bg-green-500' : ''}
                >
                  {localPaymentStatus === 'paid' ? (
                    <><CheckCircle className="w-3 h-3 mr-1" /> Paid</>
                  ) : (
                    <><XCircle className="w-3 h-3 mr-1" /> Unpaid</>
                  )}
                </Badge>
              </div>
            </div>

            {/* Update Message */}
            {updateMessage && (
              <div className={`
                p-3 rounded-lg flex items-center gap-2 text-sm
                ${updateMessage.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
                }
              `}>
                {updateMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {updateMessage.text}
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate('preparation')}
                  disabled={isUpdating || currentStatus === 'preparation'}
                >
                  Start Preparation
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate('ontheway')}
                  disabled={isUpdating || currentStatus === 'ontheway'}
                >
                  Mark as Shipped
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate('delivered')}
                  disabled={isUpdating || currentStatus === 'delivered'}
                >
                  Mark as Delivered
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={isUpdating || currentStatus === 'cancelled'}
                >
                  Cancel Order
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderStatusManager;
