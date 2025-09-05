'use client'
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useEffect } from "react";
import { fetchProducts } from "@/store/productSlice";
import { ProductTable } from "./components/productTable";

export default function Page() {
  const dispatch = useAppDispatch();
  const { products } = useAppSelector((store) => store.adminProducts);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // Remove this useEffect as it causes infinite loop
  // Products are already refreshed in the slice after successful operations

  return (
    <div className="min-h-screen bg-background">
      <ProductTable products={products || []} />
    </div>
  )
}

