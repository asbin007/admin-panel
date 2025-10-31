"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProductAdmin } from "@/store/productSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProductDebugPage() {
  const dispatch = useAppDispatch();
  const { product, status } = useAppSelector((state) => state.adminProducts);
  const [testProductId] = useState("6a7d61c5-7772-4417-a431-d4310a0706e2");

  useEffect(() => {
    if (testProductId) {
      dispatch(fetchProductAdmin(testProductId));
    }
  }, [dispatch, testProductId]);

  if (status === "loading") return <p>Loading...</p>;
  if (status === "error") return <p>Error loading product</p>;
  if (!product) return <p>No product data</p>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Product Debug Information</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Product Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><strong>ID:</strong> {product.id}</div>
          <div><strong>Name:</strong> {product.name}</div>
          <div><strong>Brand:</strong> {product.brand}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><strong>Category ID:</strong> {product.categoryId || 'N/A'}</div>
          <div><strong>Category Object:</strong> {JSON.stringify(product.Category, null, 2)}</div>
          <div><strong>Category Name:</strong> 
            <Badge variant="secondary" className="ml-2">
              {product?.Category?.categoryName || product?.categoryName || 'N/A'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Collection Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><strong>Collection ID:</strong> {product.collectionId || 'N/A'}</div>
          <div><strong>Collection Object:</strong> {JSON.stringify(product.Collection, null, 2)}</div>
          <div><strong>Collection Name:</strong> 
            <Badge variant="outline" className="ml-2">
              {product?.Collection?.collectionName || product?.collectionName || 'N/A'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Full Product Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(product, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
