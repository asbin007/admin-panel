"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
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
import { TrendingUp, DollarSign } from "lucide-react";

interface RevenueData {
  month: string;
  revenue: number;
  profit: number;
  orders: number;
}

interface RevenueChartProps {
  orders: any[];
  products: any[];
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
      profit: number; 
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
        profit: 0,
        orders: 0,
      });
    }

    // Calculate revenue and orders for each month
    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt || order.Order?.createdAt || new Date());
      const orderMonth = orderDate.getMonth();
      const orderYear = orderDate.getFullYear();
      
      const orderTotal = order.totalAmount || order.Order?.totalAmount || order.totalPrice || 0;
      
      const monthIndex = months.findIndex(m => 
        m.monthNumber === orderMonth && m.year === orderYear
      );
      
      if (monthIndex !== -1) {
        months[monthIndex].revenue += orderTotal;
        months[monthIndex].orders += 1;
      }
    });

    // Calculate profit for each month
    months.forEach((month, index) => {
      if (products && products.length > 0) {
        let monthlyProfit = 0;
        products.forEach((product) => {
          const costPrice = product.costPrice || (product.price || 0) * 0.7;
          const profitPerUnit = (product.price || 0) - costPrice;
          // Estimate monthly sales based on total sales distribution
          const estimatedMonthlySales = (product.totalQuantitySold || 0) / 12;
          monthlyProfit += profitPerUnit * estimatedMonthlySales;
        });
        month.profit = monthlyProfit;
      }
    });

    return months;
  }, [orders, products]);

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-1))",
    },
    profit: {
      label: "Profit",
      color: "hsl(var(--chart-2))",
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
          <Area
            type="monotone"
            dataKey="profit"
            stackId="2"
            stroke="var(--color-profit)"
            fill="var(--color-profit)"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
