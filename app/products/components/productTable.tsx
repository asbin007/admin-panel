"use client";

import Image from "next/image";
import { MoreHorizontal, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminLayout from "@/app/adminLayout/adminLayout";
import { IProduct } from "../types";
import { useAppDispatch } from "@/store/hooks";
import { deleteProduct } from "@/store/productSlice";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProductForm from "./productForm";

// Simple placeholder image
const PLACEHOLDER_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiLz4KPGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiLz4KPHBvbHlsaW5lIHBvaW50cz0iMjEgMTUgMTYgMTAgNSAyMSIvPgo8L3N2Zz4K";

// Cloudinary configuration
const CLOUDINARY_VERSION = "v1750340657";

export function ProductTable({ products = [] }: { products?: IProduct[] }) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await dispatch(deleteProduct(id));
        router.refresh();
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product. Please try again.");
      }
    }
  };

  const handleEdit = (product: IProduct) => {
    setEditingProduct(product);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setEditingProduct(null);
  };

  const formatPrice = (price?: number) => {
    if (price === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
    }).format(price).replace('₹', 'Rs ');
  };

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const renderProductRows = () => {
    if (!products || !Array.isArray(products)) {
      return (
        <TableRow>
          <TableCell colSpan={9} className="text-center">
            Invalid products data
          </TableCell>
        </TableRow>
      );
    }

    if (products.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={9} className="text-center">
            No products available
          </TableCell>
        </TableRow>
      );
    }

    return products
      .filter((product) => product?.id)
      .map((product) => {
        const imageUrl = product?.images?.[0]
          ? `https://res.cloudinary.com/dxpe7jikz/image/upload/${CLOUDINARY_VERSION}/${
              product.images[0].startsWith("/uploads")
                ? product.images[0].replace("/uploads", "")
                : product.images[0]
            }.jpg`
          : PLACEHOLDER_IMAGE;

        // Debug: Log image URL construction
        console.log(`Product ${product.name} image:`, {
          original: product?.images?.[0],
          constructed: imageUrl
        });

        return (
          <TableRow key={product.id}>
            <TableCell>
              <Link href={`/products/${product.id}`}>
                <div className="relative w-16 h-16">
                  <Image
                    alt={`${product.name || "Product"} image`}
                    className="rounded-md object-cover"
                    fill
                    src={imageUrl}
                    unoptimized={imageUrl === PLACEHOLDER_IMAGE}
                    sizes="64px"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                    }}
                  />
                </div>
              </Link>
            </TableCell>
            {/* Rest of your table cells remain the same */}
            <TableCell className="font-medium">
              <Link href={`/products/${product.id}`}>
                {product.name || "Unnamed Product"}
              </Link>
            </TableCell>
            <TableCell>{product.brand || "N/A"}</TableCell>
            <TableCell>
              <Badge variant={product.inStock ? "default" : "secondary"}>
                {product.inStock ? "In Stock" : "Out of Stock"}
              </Badge>
              {product.isNew && (
                <Badge variant="outline" className="ml-2">
                  New
                </Badge>
              )}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {formatPrice(product.price)}
              {product.discount && product.discount > 0 && (
                <span className="text-muted-foreground ml-2 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {product.totalStock ?? "N/A"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {product?.Category?.categoryName || "Uncategorized"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {formatDate(product.createdAt)}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-haspopup="true" size="icon" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={`/products/${product.id}`}>View</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(product)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(product.id)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        );
      });
  };

  return (
    <AdminLayout>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Products</CardTitle>
            <CardDescription>
              Manage your products and view their details.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1">
                <Plus className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Add Product
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] w-full md:max-w-7xl p-0 m-0 h-[90vh] overflow-y-auto">
              <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
                <DialogTitle>{isEditMode ? "Edit Product" : "Add New Product"}</DialogTitle>
                <DialogDescription>
                  {isEditMode 
                    ? "Update the product information below." 
                    : "Fill out the form to add a new product to the inventory."
                  }
                </DialogDescription>
              </DialogHeader>
              <ProductForm 
                closeModal={handleCloseDialog} 
                editProduct={editingProduct || undefined}
                isEdit={isEditMode}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  Image
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Price</TableHead>
                <TableHead className="hidden md:table-cell">Stock</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden md:table-cell">
                  Created At
                </TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderProductRows()}</TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-{products.length}</strong> of{" "}
            <strong>{products.length}</strong> products
          </div>
        </CardFooter>
      </Card>
    </AdminLayout>
  );
}
