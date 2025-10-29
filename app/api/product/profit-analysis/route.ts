import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/globals/http';

interface ProfitData {
  id: string;
  name: string;
  brand: string;
  sellingPrice: number;
  costPrice: number;
  profit: number;
  profitPercentage: number;
  totalStock: number;
  totalProfit: number;
  category: string;
  collection: string;
}

interface ProfitSummary {
  totalProducts: number;
  totalProfit: number;
  averageProfitPercentage: number;
}

interface ProfitAnalysisResponse {
  products: ProfitData[];
  summary: ProfitSummary;
}

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Extract token from Bearer format
    const token = authHeader.replace('Bearer ', '');
    
    // Fetch products data
    let productsResponse;
    try {
      productsResponse = await API.get('/product', {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });
    } catch {
      return NextResponse.json(
        { message: 'Failed to fetch products data' },
        { status: 500 }
      );
    }

    if (!productsResponse || productsResponse.status !== 200) {
      return NextResponse.json(
        { message: 'Failed to fetch products data' },
        { status: 500 }
      );
    }

    const products = productsResponse.data.data || productsResponse.data || [];

    // Fetch orders data
    let ordersResponse;
    try {
      ordersResponse = await API.get('/order/all', {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });
    } catch {
      ordersResponse = { data: { data: [] } };
    }

    const orders = ordersResponse.data.data || ordersResponse.data || [];

    // Create a map of product sales from orders
    const productSalesMap = new Map<string, { quantity: number; revenue: number }>();
    
    orders.forEach((order: unknown) => {
      const orderData = order as { 
        orderItems?: unknown[]; 
        Order?: { orderItems?: unknown[] };
        orderDetails?: unknown[];
      };
      
      // Check if order has orderDetails array (from order details API)
      if (orderData.orderDetails && Array.isArray(orderData.orderDetails)) {
        orderData.orderDetails.forEach((detail: unknown) => {
          const detailData = detail as { 
            productId: string; 
            quantity: string | number; 
            Shoe?: { price: number } 
          };
          const quantity = typeof detailData.quantity === 'string' ? parseInt(detailData.quantity) : detailData.quantity;
          const price = detailData.Shoe?.price || 0;
          const existing = productSalesMap.get(detailData.productId) || { quantity: 0, revenue: 0 };
          productSalesMap.set(detailData.productId, {
            quantity: existing.quantity + quantity,
            revenue: existing.revenue + (price * quantity)
          });
        });
      }
      
      // Also check for orderItems array (if it exists)
      const orderItems = orderData.orderItems || orderData.Order?.orderItems || [];
      orderItems.forEach((item: unknown) => {
        const itemData = item as { productId: string; quantity: number; price: number };
        const existing = productSalesMap.get(itemData.productId) || { quantity: 0, revenue: 0 };
        productSalesMap.set(itemData.productId, {
          quantity: existing.quantity + itemData.quantity,
          revenue: existing.revenue + (itemData.price * itemData.quantity)
        });
      });
    });

    // Calculate profit for each product
    const profitData: ProfitData[] = products.map((product: unknown) => {
      const productData = product as {
        id: string;
        name: string;
        brand?: string;
        price?: number;
        costPrice?: number;
        totalStock?: number;
        Category?: { categoryName: string };
        Collection?: { collectionName: string };
      };
      
      // Use actual cost price if available, otherwise estimate as 70% of selling price
      const costPrice = productData.costPrice || (productData.price || 0) * 0.7;
      const sellingPrice = productData.price || 0;
      const profit = sellingPrice - costPrice;
      const profitPercentage = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
      const totalProfit = profit * (productData.totalStock || 0);

      return {
        id: productData.id,
        name: productData.name,
        brand: productData.brand || 'Unknown Brand',
        sellingPrice,
        costPrice,
        profit,
        profitPercentage,
        totalStock: productData.totalStock || 0,
        totalProfit,
        category: productData.Category?.categoryName || 'Uncategorized',
        collection: productData.Collection?.collectionName || 'No Collection'
      };
    });

    // Calculate summary
    const totalProducts = profitData.length;
    const totalProfit = profitData.reduce((sum, product) => sum + product.totalProfit, 0);
    const averageProfitPercentage = totalProducts > 0 
      ? profitData.reduce((sum, product) => sum + product.profitPercentage, 0) / totalProducts 
      : 0;

    const summary: ProfitSummary = {
      totalProducts,
      totalProfit,
      averageProfitPercentage
    };

    const response: ProfitAnalysisResponse = {
      products: profitData,
      summary
    };

    return NextResponse.json({
      message: 'Profit analysis calculated successfully',
      data: response
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
