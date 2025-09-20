"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
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
import { BarChart3, Package } from "lucide-react";

interface ProductPerformanceChartProps {
  products: any[];
}

export function ProductPerformanceChart({ products }: ProductPerformanceChartProps) {
  const chartData = useMemo(() => {
    if (!products || products.length === 0) {
      return [];
    }

    // Get top 10 products by quantity sold
    const topProducts = products
      .map(product => ({
        name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
        fullName: product.name,
        quantitySold: product.totalQuantitySold || 0,
        revenue: product.totalRevenue || 0,
        stock: product.totalStock || 0,
        price: product.price || 0,
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);

    return topProducts;
  }, [products]);

  const chartConfig = {
    quantitySold: {
      label: "Quantity Sold",
      color: "hsl(var(--chart-1))",
    },
    revenue: {
      label: "Revenue (Rs)",
      color: "hsl(var(--chart-2))",
    },
    stock: {
      label: "Stock",
      color: "hsl(var(--chart-3))",
    },
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No product data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Top Products Performance</h3>
      </div>
      
      <ChartContainer config={chartConfig} className="h-64">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={80}
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
          <Bar 
            dataKey="quantitySold" 
            fill="var(--color-quantitySold)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
