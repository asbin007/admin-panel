"use client";

import React from 'react';
import { CheckCircle, Clock, Package, Truck, Home, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OrderTimelineProps {
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
  isAdmin?: boolean;
  // Real-time update props
  orderId?: string;
  onRefresh?: () => void;
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({ 
  currentStatus, 
  onStatusChange, 
  isAdmin = false,
  orderId,
  onRefresh
}) => {
  const statusLevels = [
    {
      key: 'pending',
      label: 'Pending',
      icon: Clock,
      color: 'text-gray-500',
      bgColor: 'bg-gray-100',
      description: 'Order received and waiting for confirmation'
    },
    {
      key: 'preparation',
      label: 'Preparation',
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
      description: 'Order is being prepared'
    },
    {
      key: 'ontheway',
      label: 'On the Way',
      icon: Truck,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100',
      description: 'Order is out for delivery'
    },
    {
      key: 'delivered',
      label: 'Delivered',
      icon: Home,
      color: 'text-green-500',
      bgColor: 'bg-green-100',
      description: 'Order has been delivered'
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-100',
      description: 'Order has been cancelled'
    }
  ];

  const getCurrentLevelIndex = () => {
    if (!currentStatus || typeof currentStatus !== 'string') {
      return -1; // Return -1 if currentStatus is undefined, null, or not a string
    }
    return statusLevels.findIndex(level => level.key === currentStatus.toLowerCase());
  };

  const currentLevelIndex = getCurrentLevelIndex();
  const isCompleted = (index: number) => index < currentLevelIndex;
  const isCurrent = (index: number) => index === currentLevelIndex;
  const isCancelled = currentStatus && typeof currentStatus === 'string' && currentStatus.toLowerCase() === 'cancelled';

  const handleStatusClick = (statusKey: string) => {
    if (isAdmin && onStatusChange && currentStatus && statusKey !== currentStatus.toLowerCase()) {
      onStatusChange(statusKey);
    }
  };

  // Early return if currentStatus is not available
  if (!currentStatus || typeof currentStatus !== 'string') {
    return (
      <div className="w-full p-4 text-center text-gray-500">
        <p>Loading order status...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        {statusLevels.map((level, index) => {
          const Icon = level.icon;
          const completed = isCompleted(index);
          const current = isCurrent(index);
          const cancelled = isCancelled && level.key === 'cancelled';
          
          return (
            <div key={level.key} className="relative flex items-start pb-8 last:pb-0">
              {/* Timeline dot */}
              <div className={`
                relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                ${completed 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : current 
                    ? cancelled
                      ? 'bg-red-500 border-red-500 text-white'
                      : `${level.bgColor} border-current ${level.color}`
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }
                ${isAdmin ? 'cursor-pointer hover:scale-110' : ''}
              `}
              onClick={() => handleStatusClick(level.key)}
              >
                {completed ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>

              {/* Content */}
              <div className="ml-4 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className={`
                    text-lg font-semibold transition-colors duration-300
                    ${completed 
                      ? 'text-green-600' 
                      : current 
                        ? cancelled
                          ? 'text-red-600'
                          : level.color
                        : 'text-gray-400'
                    }
                  `}>
                    {level.label}
                  </h3>
                  
                  {current && !cancelled && (
                    <Badge variant="outline" className="animate-pulse">
                      Current
                    </Badge>
                  )}
                  
                  {completed && (
                    <Badge className="bg-green-500 text-white">
                      ✓ Completed
                    </Badge>
                  )}
                  
                  {cancelled && (
                    <Badge variant="destructive">
                      Cancelled
                    </Badge>
                  )}
                </div>
                
                <p className={`
                  text-sm mt-1 transition-colors duration-300
                  ${completed 
                    ? 'text-green-600' 
                    : current 
                      ? cancelled
                        ? 'text-red-600'
                        : level.color
                      : 'text-gray-400'
                  }
                `}>
                  {level.description}
                </p>

                {/* Progress indicator for current status */}
                {current && !cancelled && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                    <div className={`
                      h-1 rounded-full transition-all duration-1000 ease-out
                      ${level.bgColor.replace('bg-', 'bg-').replace('-100', '-500')}
                    `} style={{ width: '60%' }}></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status change buttons for admin */}
      {isAdmin && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Status Update</h4>
          <div className="flex flex-wrap gap-2">
            {statusLevels.map((level) => {
              const isCurrentStatus = level.key === currentStatus.toLowerCase();
              return (
                <button
                  key={level.key}
                  onClick={() => handleStatusClick(level.key)}
                  disabled={isCurrentStatus}
                  className={`
                    px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200
                    ${isCurrentStatus
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : `hover:scale-105 ${level.bgColor} ${level.color} hover:shadow-md`
                    }
                  `}
                >
                  {level.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTimeline;
