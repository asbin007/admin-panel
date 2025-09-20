"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { PieChart as PieChartIcon } from "lucide-react";

interface OrderStatusChartProps {
  orders: any[];
}

export function OrderStatusChart({ orders }: OrderStatusChartProps) {
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) {
      return [];
    }

    const statusCounts = {
      pending: 0,
      preparation: 0,
      delivered: 0,
      cancelled: 0,
      other: 0,
    };

    orders.forEach((order) => {
      const status = order.orderStatus || order.status || order.Order?.status || 'pending';
      
      switch (status.toLowerCase()) {
        case 'pending':
          statusCounts.pending++;
          break;
        case 'preparation':
          statusCounts.preparation++;
          break;
        case 'delivered':
          statusCounts.delivered++;
          break;
        case 'cancelled':
          statusCounts.cancelled++;
          break;
        default:
          statusCounts.other++;
          break;
      }
    });

    return [
      {
        name: "Pending",
        value: statusCounts.pending,
        color: "#f59e0b", // yellow-500
      },
      {
        name: "Preparation",
        value: statusCounts.preparation,
        color: "#3b82f6", // blue-500
      },
      {
        name: "Delivered",
        value: statusCounts.delivered,
        color: "#10b981", // emerald-500
      },
      {
        name: "Cancelled",
        value: statusCounts.cancelled,
        color: "#ef4444", // red-500
      },
      {
        name: "Other",
        value: statusCounts.other,
        color: "#6b7280", // gray-500
      },
    ].filter(item => item.value > 0);
  }, [orders]);

  const chartConfig = {
    pending: {
      label: "Pending Orders",
      color: "#f59e0b",
    },
    preparation: {
      label: "In Preparation",
      color: "#3b82f6",
    },
    delivered: {
      label: "Delivered",
      color: "#10b981",
    },
    cancelled: {
      label: "Cancelled",
      color: "#ef4444",
    },
    other: {
      label: "Other",
      color: "#6b7280",
    },
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <PieChartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No order data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <PieChartIcon className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Order Status Distribution</h3>
      </div>
      
      <ChartContainer config={chartConfig} className="h-64">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
        </PieChart>
      </ChartContainer>
    </div>
  );
}
