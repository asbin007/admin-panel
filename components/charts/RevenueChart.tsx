"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
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
import { TrendingUp, DollarSign } from "lucide-react";

interface RevenueChartProps {
  orders: unknown[];
  products: unknown[];
}

export function RevenueChart({ orders, products }: RevenueChartProps) {
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) {
      return [];
    }

    // Generate last 12 months data
    const months: { 
      month: string; 
      monthNumber: number; 
      year: number; 
      revenue: number; 
      orders: number;
    }[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      
      months.push({
        month: `${monthName} ${year}`,
        monthNumber: date.getMonth(),
        year: year,
        revenue: 0,
        orders: 0,
      });
    }

    // Calculate revenue and orders for each month
    orders.forEach((order) => {
      const orderDate = new Date((order as { createdAt?: string; Order?: { createdAt?: string } }).createdAt || (order as { createdAt?: string; Order?: { createdAt?: string } }).Order?.createdAt || new Date());
      const orderMonth = orderDate.getMonth();
      const orderYear = orderDate.getFullYear();
      
      const orderTotal = (order as { totalAmount?: number; Order?: { totalAmount?: number }; totalPrice?: number }).totalAmount || (order as { totalAmount?: number; Order?: { totalAmount?: number }; totalPrice?: number }).Order?.totalAmount || (order as { totalAmount?: number; Order?: { totalAmount?: number }; totalPrice?: number }).totalPrice || 0;
      
      const monthIndex = months.findIndex(m => 
        m.monthNumber === orderMonth && m.year === orderYear
      );
      
      if (monthIndex !== -1) {
        months[monthIndex].revenue += orderTotal;
        months[monthIndex].orders += 1;
      }
    });

    return months;
  }, [orders, products]);

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-1))",
    },
    orders: {
      label: "Orders",
      color: "hsl(var(--chart-3))",
    },
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No revenue data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Revenue & Profit Trends</h3>
      </div>
      
      <ChartContainer config={chartConfig} className="h-64">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stackId="1"
            stroke="var(--color-revenue)"
            fill="var(--color-revenue)"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
