'use client'
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useEffect } from "react";
import { fetchProducts } from "@/store/productSlice";
import { ProductTable } from "./components/productTable";

export default function Page() {
  const dispatch = useAppDispatch();
  const { products, status } = useAppSelector((store) => store.adminProducts);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // Refresh products when status changes to SUCCESS (after adding a product)
  useEffect(() => {
    if (status === 'success') {
      dispatch(fetchProducts());
    }
  }, [status, dispatch]);

  return (
    <div className="min-h-screen bg-background">
      <ProductTable products={products || []} />
    </div>
  )
}

