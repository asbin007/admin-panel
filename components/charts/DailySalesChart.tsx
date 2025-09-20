"use client";

import { useMemo } from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Activity, Calendar } from "lucide-react";

interface DailySalesChartProps {
  orders: any[];
}

export function DailySalesChart({ orders }: DailySalesChartProps) {
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) {
      return [];
    }

    // Generate last 30 days data
    const days: { 
      date: string; 
      fullDate: string; 
      revenue: number; 
      orders: number; 
      dayOfWeek: number;
    }[] = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = date.getDate();
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      days.push({
        date: `${dayName} ${dayNumber}`,
        fullDate: date.toISOString().split('T')[0],
        revenue: 0,
        orders: 0,
        dayOfWeek: date.getDay(),
      });
    }

    // Calculate daily revenue and orders
    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt || order.Order?.createdAt || new Date());
      const orderDateString = orderDate.toISOString().split('T')[0];
      
      const dayIndex = days.findIndex(d => d.fullDate === orderDateString);
      
      if (dayIndex !== -1) {
        const orderTotal = order.totalAmount || order.Order?.totalAmount || order.totalPrice || 0;
        days[dayIndex].revenue += orderTotal;
        days[dayIndex].orders += 1;
      }
    });

    return days;
  }, [orders]);

  const chartConfig = {
    revenue: {
      label: "Daily Revenue",
      color: "hsl(var(--chart-1))",
    },
    orders: {
      label: "Daily Orders",
      color: "hsl(var(--chart-2))",
    },
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No sales data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Daily Sales Trend (Last 30 Days)</h3>
      </div>
      
      <ChartContainer config={chartConfig} className="h-64">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <ChartTooltip 
            content={<ChartTooltipContent />}
            formatter={(value, name) => {
              if (name === 'revenue') {
                return [`Rs ${Number(value).toFixed(2)}`, 'Revenue'];
              }
              return [value, name];
            }}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--color-revenue)"
            strokeWidth={2}
            dot={{ fill: "var(--color-revenue)", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="var(--color-orders)"
            strokeWidth={2}
            dot={{ fill: "var(--color-orders)", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
