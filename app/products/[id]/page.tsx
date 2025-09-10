"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Package,
  Trash2,
  Calendar,
  Tag,
  Palette,
  Ruler,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProductAdmin, deleteProduct} from "@/store/productSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Status } from "@/store/authSlice";
import ProductForm from "../components/productForm";

export default function ProductDetailsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { product, status } = useAppSelector((state) => state.adminProducts);

  const CLOUDINARY_VERSION = process.env.NEXT_PUBLIC_CLOUDINARY_VERSION || "v1750340657";

  useEffect(() => {
    if (id) dispatch(fetchProductAdmin(id as string));
  }, [dispatch, id]);

  // Refresh product details after successful edit
  useEffect(() => {
    if (status === Status.SUCCESS && id) {
      dispatch(fetchProductAdmin(id as string)); // Refresh product details
      setIsModalOpen(false); 
    }
  }, [status, dispatch, id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
    }).format(price).replace('₹', 'Rs ');
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await dispatch(deleteProduct(id as string));
        router.push("/products"); // Redirect to product list after deletion
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product. Please try again.");
      }
    }
  };

  const closeModal = () => setIsModalOpen(false);

  // Helper function to safely parse array data
  const parseArrayData = (data: string[] | string | undefined): string[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return data.split(',').map(item => item.trim()).filter(Boolean);
      }
    }
    return [];
  };

  // Helper function to get image URL
  const getImageUrl = (images: string[] | string | undefined): string => {
    if (!images) return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgNzVDMTEwLjUgNzUgNzcgMTA4LjUgNzcgMTQ4Qzc3IDE4Ny41IDExMC41IDIyMSAxNTAgMjIxQzE4OS41IDIyMSAyMjMgMTg3LjUgMjIzIDE0OEMyMjMgMTA4LjUgMTg5LjUgNzUgMTUwIDc1Wk0xNTAgMTk1QzExOS4zIDE5NSA5NSAxNzAuNyA5NSAxNDBDOTUgMTA5LjMgMTE5LjMgODUgMTUwIDg1QzE4MC43IDg1IDIwNSAxMDkuMyAyMDUgMTQwQzIwNSAxNzAuNyAxODAuNyAxOTUgMTUwIDE5NVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE1MCAxNjVDMTM1LjYgMTY1IDEyNCAxNTMuNCAxMjQgMTM5QzEyNCAxMjQuNiAxMzUuNiAxMTMgMTUwIDExM0MxNjQuNCAxMTMgMTc2IDEyNC42IDE3NiAxMzlDMTc2IDE1My40IDE2NC40IDE2NSAxNTAgMTY1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K";
    
    let imagePath: string;
    if (Array.isArray(images)) {
      imagePath = images[0] || "";
    } else {
      imagePath = images;
    }

    if (!imagePath) return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgNzVDMTEwLjUgNzUgNzcgMTA4LjUgNzcgMTQ4Qzc3IDE4Ny41IDExMC41IDIyMSAxNTAgMjIxQzE4OS41IDIyMSAyMjMgMTg3LjUgMjIzIDE0OEMyMjMgMTA4LjUgMTg5LjUgNzUgMTUwIDc1Wk0xNTAgMTk1QzExOS4zIDE5NSA5NSAxNzAuNyA5NSAxNDBDOTUgMTA5LjMgMTE5LjMgODUgMTUwIDg1QzE4MC43IDg1IDIwNSAxMDkuMyAyMDUgMTQwQzIwNSAxNzAuNyAxODAuNyAxOTUgMTUwIDE5NVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE1MCAxNjVDMTM1LjYgMTY1IDEyNCAxNTMuNCAxMjQgMTM5QzEyNCAxMjQuNiAxMzUuNiAxMTMgMTUwIDExM0MxNjQuNCAxMTMgMTc2IDEyNC42IDE3NiAxMzlDMTc2IDE1My40IDE2NC40IDE2NSAxNTAgMTY1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K";

    // If it's already a Cloudinary URL, return as is
    if (imagePath.includes('cloudinary.com')) {
      return imagePath;
    }

    // Remove /uploads prefix if present and clean the path
    let cleanPath = imagePath;
    
    // Remove /uploads prefix using regex to handle both /uploads/ and uploads/
    cleanPath = cleanPath.replace(/^\/?uploads\//, '');
    
    // Remove leading slash if present
    cleanPath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
    
    // Ensure the path has the correct extension
    if (!cleanPath.includes('.')) {
      cleanPath += '.jpg'; // Default to jpg if no extension
    }
    
    return `https://res.cloudinary.com/dxpe7jikz/image/upload/${CLOUDINARY_VERSION}/${cleanPath}`;
  };

  if (!product) return <p>Loading...</p>;

  // Parse the variant data
  const colors = parseArrayData(product.colors);
  const sizes = parseArrayData(product.sizes);
  const features = parseArrayData(product.features);
  
  // Get all image URLs
  const getAllImageUrls = (images: string[] | string | undefined): string[] => {
    if (!images) return [];
    
    if (Array.isArray(images)) {
      return images.map(img => {
        if (img.includes('cloudinary.com')) {
          return img;
        }
        // Remove /uploads prefix using regex to handle both /uploads/ and uploads/
        let cleanPath = img.replace(/^\/?uploads\//, '');
        cleanPath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
        if (!cleanPath.includes('.')) {
          cleanPath += '.jpg';
        }
        return `https://res.cloudinary.com/dxpe7jikz/image/upload/${CLOUDINARY_VERSION}/${cleanPath}`;
      });
    } else {
      return [getImageUrl(images)];
    }
  };
  
  const imageUrls = getAllImageUrls(product.images);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">Product Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsModalOpen(true)}>
    <Edit className="h-4 w-4 mr-2" />
    Edit
  </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Images */}
          <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Images ({imageUrls.length})
            </CardTitle>
            </CardHeader>
            <CardContent>
            {imageUrls.length > 0 ? (
              <div className="space-y-4">
                {/* Main large image */}
                <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                  <Image
                    src={imageUrls[selectedImageIndex]}
                    alt={`${product.name} - Main image`}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgNzVDMTEwLjUgNzUgNzcgMTA4LjUgNzcgMTQ4Qzc3IDE4Ny41IDExMC41IDIyMSAxNTAgMjIxQzE4OS41IDIyMSAyMjMgMTg3LjUgMjIzIDE0OEMyMjMgMTA4LjUgMTg5LjUgNzUgMTUwIDc1Wk0xNTAgMTk1QzExOS4zIDE5NSA5NSAxNzAuNyA5NSAxNDBDOTUgMTA5LjMgMTE5LjMgODUgMTUwIDg1QzE4MC43IDg1IDIwNSAxMDkuMyAyMDUgMTQwQzIwNSAxNzAuNyAxODAuNyAxOTUgMTUwIDE5NVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE1MCAxNjVDMTM1LjYgMTY1IDEyNCAxNTMuNCAxMjQgMTM5QzEyNCAxMjQuNiAxMzUuNiAxMTMgMTUwIDExM0MxNjQuNCAxMTMgMTc2IDEyNC42IDE3NiAxMzlDMTc2IDE1My40IDE2NC40IDE2NSAxNTAgMTY1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K";
                    }}
                  />
                </div>
                
                {/* Thumbnail gallery */}
                {imageUrls.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {imageUrls.map((imageUrl, index) => (
                      <div 
                        key={index} 
                        className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors cursor-pointer ${
                          selectedImageIndex === index 
                            ? 'border-blue-500 ring-2 ring-blue-200' 
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => setSelectedImageIndex(index)}
                      >
                      <Image
                        src={imageUrl}
                          alt={`${product.name} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgNzVDMTEwLjUgNzUgNzcgMTA4LjUgNzcgMTQ4Qzc3IDE4Ny41IDExMC41IDIyMSAxNTAgMjIxQzE4OS41IDIyMSAyMjMgMTg3LjUgMjIzIDE0OEMyMjMgMTA4LjUgMTg5LjUgNzUgMTUwIDc1Wk0xNTAgMTk1QzExOS4zIDE5NSA5NSAxNzAuNyA5NSAxNDBDOTUgMTA5LjMgMTE5LjMgODUgMTUwIDg1QzE4MC43IDg1IDIwNSAxMDkuMyAyMDUgMTQwQzIwNSAxNzAuNyAxODAuNyAxOTUgMTUwIDE5NVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE1MCAxNjVDMTM1LjYgMTY1IDEyNCAxNTMuNCAxMjQgMTM5QzEyNCAxMjQuNiAxMzUuNiAxMTMgMTUwIDExM0MxNjQuNCAxMTMgMTc2IDEyNC42IDE3NiAxMzlDMTc2IDE1My40IDE2NC40IDE2NSAxNTAgMTY1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K";
                          }}
                      />
                    </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <p className="text-gray-500">No images available</p>
              </div>
            )}
            </CardContent>
          </Card>

        {/* Product Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <p className="text-muted-foreground">{product.brand}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Price:</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatPrice(product.price)}
                  </span>
                </div>
                {product.discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Original Price:</span>
                    <span className="text-sm line-through text-muted-foreground">
                      {formatPrice(product.originalPrice)}
                    </span>
                  </div>
                )}
                {product.discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Discount:</span>
                    <Badge variant="destructive">{product.discount}% OFF</Badge>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Stock Status:</span>
                  <Badge variant={product.inStock ? "default" : "destructive"}>
                    {product.inStock ? "In Stock" : "Out of Stock"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Available Stock:</span>
                  <span className="text-sm">{product.totalStock} units</span>
                </div>
                {product.isNew && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant="secondary">New Product</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{product.description}</p>
            </CardContent>
          </Card>
              </div>
              </div>

      {/* Product Variants */}
          <Card>
            <CardHeader>
              <CardTitle>Variants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
          {colors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="h-4 w-4" />
                  <span className="text-sm font-medium">Colors</span>
                </div>
                <div className="flex flex-wrap gap-1">
                {colors.map((color, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>
          )}

          {sizes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Ruler className="h-4 w-4" />
                  <span className="text-sm font-medium">Sizes</span>
                </div>
                <div className="flex flex-wrap gap-1">
                {sizes.map((size, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {size}
                    </Badge>
                  ))}
                </div>
              </div>
          )}

          {features.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4" />
                <span className="text-sm font-medium">Features</span>
                </div>
                <div className="flex flex-wrap gap-1">
                {features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                    {feature}
                    </Badge>
                  ))}
                </div>
              </div>
          )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Category & Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Brand:</span>
                <span className="text-sm">{product.brand}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Cost Price:</span>
                <span className="text-sm font-semibold text-green-600">Rs {product.costPrice?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Category:</span>
                <Badge variant="secondary">{product?.Category?.categoryName || 'N/A'}</Badge>
              </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Collection:</span>
            <Badge variant="outline">{product?.Collection?.collectionName || 'N/A'}</Badge>
          </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Created: {formatDate(product.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

      {/* Edit Product Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[90vw] w-full md:max-w-7xl p-0 m-0 h-[90vh] overflow-y-auto">
          <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product information below.
            </DialogDescription>
          </DialogHeader>
          <ProductForm 
            closeModal={closeModal}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
