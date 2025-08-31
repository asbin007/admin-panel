"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import toast from "react-hot-toast"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { addProduct } from "@/store/productSlice"
import { resetStatus, fetchCategoryItems } from "@/store/categoriesSlice"
import { fetchCollection } from "@/store/collectionSlice"
import {
  Upload,
  X,
  AlertCircle,
  Package,
  Tag,
  Palette,
  Ruler,
  Star,
  ImageIcon,
  Trash2,
  Eye,
  Save,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react"

interface AddProductFormProps {
  closeModal: () => void
}

interface FormData {
  images: File[]
  name: string
  description: string
  brand: string
  discount: number
  originalPrice: number
  price: number
  inStock: boolean
  isNew: boolean
  totalStock: number
  features: string[]
  colors: string[]
  sizes: string[]
  Category: {
    id: string
    categoryName: string
  }
  Collection: {
    id: string
    collectionName: string
  }
}

interface FormErrors {
  [key: string]: string
}

const AddProductForm: React.FC<AddProductFormProps> = ({ closeModal }) => {
  const dispatch = useAppDispatch()
  const { items: categories } = useAppSelector((store) => store.category)
  const { collection: collections } = useAppSelector((store) => store.collections)

  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [errors, setErrors] = useState<FormErrors>({})
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [inputValues, setInputValues] = useState({
    sizes: "",
    colors: "",
    features: ""
  })

  const [formData, setFormData] = useState<FormData>({
    images: [],
    name: "",
    description: "",
    brand: "",
    discount: 0,
    originalPrice: 0,
    price: 0,
    inStock: true,
    isNew: false,
    totalStock: 0,
    features: [],
    colors: [],
    sizes: [],
    Category: { id: "", categoryName: "" },
    Collection: { id: "", collectionName: "" },
  })

  // Auto-calculate price based on original price and discount
  useEffect(() => {
    if (formData.originalPrice > 0 && formData.discount > 0) {
      const calculatedPrice = formData.originalPrice * (1 - formData.discount / 100)
      setFormData((prev) => ({ ...prev, price: Math.round(calculatedPrice * 100) / 100 }))
    }
  }, [formData.originalPrice, formData.discount])

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) newErrors.name = "Product name is required"
    if (!formData.brand.trim()) newErrors.brand = "Brand is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (formData.originalPrice <= 0) newErrors.originalPrice = "Original price must be greater than 0"
    if (formData.price <= 0) newErrors.price = "Price must be greater than 0"
    if (formData.price > formData.originalPrice) newErrors.price = "Price cannot exceed original price"
    if (formData.totalStock < 0) newErrors.totalStock = "Stock cannot be negative"
    if (!formData.Category.id) newErrors.category = "Please select a category"
    if (!formData.Collection.id) newErrors.collection = "Please select a collection"
    if (formData.images.length === 0) newErrors.images = "At least one product image is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle file uploads with drag & drop
  const handleImageUpload = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const validFiles = fileArray.filter((file) => {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image file`)
          return false
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 5MB limit`)
          return false
        }
        return true
      })

      if (validFiles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...validFiles].slice(0, 6), // Max 6 images
        }))

        // Create previews
        validFiles.forEach((file) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            setImagePreviews((prev) => [...prev, e.target?.result as string])
          }
          reader.readAsDataURL(file)
        })
      }
    },
    [],
  )

  // Remove image
  const removeImage = (index: number) => {
        setFormData((prev) => ({
          ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }



  // Handle Enter key for adding items
  const handleKeyDown = (field: "features" | "colors" | "sizes", e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const currentValue = inputValues[field].trim()
      if (currentValue) {
        const newItems = [...formData[field], currentValue]
        setFormData((prev) => ({ ...prev, [field]: newItems }))
        setInputValues((prev) => ({ ...prev, [field]: "" }))
      }
    }
  }

  // Handle input changes
  const handleInputChange = (field: "features" | "colors" | "sizes", value: string) => {
    setInputValues((prev) => ({ ...prev, [field]: value }))
    // Also handle comma separation
    if (value.includes(',')) {
      const items = value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      if (items.length > 1) {
        const newItems = [...formData[field], ...items]
        setFormData((prev) => ({ ...prev, [field]: newItems }))
        setInputValues((prev) => ({ ...prev, [field]: "" }))
      }
    }
  }

  // Remove item from array
  const removeItem = (field: "features" | "colors" | "sizes", index: number) => {
      setFormData((prev) => ({
        ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
    }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fix the errors and try again")
      return
    }

    setLoading(true)

    const data = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "images" && Array.isArray(value)) {
        value.forEach((file) => data.append("images", file))
      } else if (key === "Category") {
        data.append("categoryId", formData.Category.id)
      } else if (key === "Collection") {
        data.append("collectionId", formData.Collection.id)
      } else if (Array.isArray(value)) {
        // Don't use JSON.stringify for arrays - append each item separately
        value.forEach((item) => data.append(key, item))
      } else if (typeof value !== "object") {
        data.append(key, value.toString())
      }
    })

    try {
      await dispatch(addProduct(data))
      toast.success("Product has been added successfully!")
      closeModal()
      dispatch(resetStatus())
    } catch (error) {
      console.error("Error adding product:", error)
      toast.error("Failed to add product. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleImageUpload(files)
    }
  }

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchCategoryItems())
    dispatch(fetchCollection())
  }, [dispatch])

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="w-full max-w-6xl max-h-[95vh] overflow-hidden">
        <Card className="shadow-2xl border-0 bg-background max-h-[90vh] sm:max-h-[95vh]">
          <CardHeader className="bg-muted/40 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-6 w-6 text-primary" />
            </div>
                Create New Product
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeModal}
                className="h-10 w-10 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 lg:p-8">
            <form onSubmit={handleSubmit}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-muted p-1 rounded-lg">
                  <TabsTrigger
                    value="basic"
                    className="flex items-center gap-2 data-[state=active]:bg-background"
                  >
                    <Tag className="h-4 w-4" />
                    Basic Info
                  </TabsTrigger>
                  <TabsTrigger
                    value="media"
                    className="flex items-center gap-2 data-[state=active]:bg-background"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Media
                  </TabsTrigger>
                  <TabsTrigger
                    value="pricing"
                    className="flex items-center gap-2 data-[state=active]:bg-background"
                  >
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">Rs</span>
                    Pricing
                  </TabsTrigger>
                  <TabsTrigger
                    value="details"
                    className="flex items-center gap-2 data-[state=active]:bg-background"
                  >
                    <Star className="h-4 w-4" />
                    Details
                  </TabsTrigger>
                </TabsList>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="name" className="text-base sm:text-lg font-semibold flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          Product Name *
                        </Label>
            <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                          className={`h-10 sm:h-12 text-base sm:text-lg ${errors.name ? "border-destructive" : "border-input"} focus:border-primary transition-colors`}
                          placeholder="Enter an amazing product name..."
                        />
                        {errors.name && (
                          <p className="text-red-500 text-sm flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.name}
                          </p>
                        )}
          </div>

                      <div className="space-y-3">
                        <Label htmlFor="brand" className="text-base sm:text-lg font-semibold flex items-center gap-2">
                          <Zap className="h-5 w-5 text-primary" />
                          Brand *
                        </Label>
            <Input
                          id="brand"
                          value={formData.brand}
                          onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
                          className={`h-10 sm:h-12 text-base sm:text-lg ${errors.brand ? "border-destructive" : "border-input"} focus:border-primary transition-colors`}
                          placeholder="Brand name"
            />
                        {errors.brand && (
                          <p className="text-red-500 text-sm flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.brand}
                          </p>
            )}
          </div>

                      <div className="space-y-3">
                        <Label className="text-base sm:text-lg font-semibold">Category & Collection *</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Select
                value={formData.Category.id}
                              onValueChange={(value) => {
                                const category = categories.find((c) => c.id === value)
                                if (category) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    Category: { id: category.id, categoryName: category.categoryName },
                                  }))
                                }
                              }}
              >
                              <SelectTrigger className={`h-10 sm:h-12 ${errors.category ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={formData.Collection.id}
                              onValueChange={(value) => {
                                const collection = collections.find((c) => c.id === value)
                                if (collection) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    Collection: { id: collection.id, collectionName: collection.collectionName },
                                  }))
                                }
                              }}
              >
                              <SelectTrigger className={`h-10 sm:h-12 ${errors.collection ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Select Collection" />
                </SelectTrigger>
                              <SelectContent>
                                {collections.map((collection) => (
                                  <SelectItem key={collection.id} value={collection.id}>
                                    {collection.collectionName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
                        </div>
                        {(errors.category || errors.collection) && (
                          <p className="text-destructive text-sm flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.category || errors.collection}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="description" className="text-lg font-semibold">
                          Product Description *
                        </Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                          className={`min-h-[200px] text-base ${errors.description ? "border-destructive" : "border-input"} focus:border-primary transition-colors`}
                          placeholder="Describe your product in detail. What makes it special?"
                        />
                        {errors.description && (
                          <p className="text-destructive text-sm flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.description}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">{formData.description.length}/1000 characters</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                          <Switch
                            id="inStock"
                            checked={formData.inStock}
                            onCheckedChange={(checked: boolean) => setFormData((prev) => ({ ...prev, inStock: checked }))}
                          />
                          <Label htmlFor="inStock" className="font-medium">
                            In Stock
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                          <Switch
                            id="isNew"
                            checked={formData.isNew}
                            onCheckedChange={(checked: boolean) => setFormData((prev) => ({ ...prev, isNew: checked }))}
                          />
                          <Label htmlFor="isNew" className="font-medium">
                            New Product
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Media Tab */}
                <TabsContent value="media" className="space-y-8">
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold mb-2">Product Images</h3>
                      <p className="text-muted-foreground">
                        Upload up to 6 high-quality images of your product
                      </p>
          </div>

                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                        formData.images.length >= 6
                          ? "border-muted-foreground/30 bg-muted/30"
                          : "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 cursor-pointer"
                      }`}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => {
                        if (formData.images.length < 6) {
                          document.getElementById("image-upload")?.click()
                        }
                      }}
                    >
                      <Upload className="h-16 w-16 mx-auto mb-4 text-primary" />
                      <h4 className="text-xl font-semibold mb-2">
                        {formData.images.length >= 6 ? "Maximum images reached" : "Drop images here or click to upload"}
                      </h4>
                      <p className="text-muted-foreground">
                        {formData.images.length >= 6
                          ? "You can upload up to 6 images maximum"
                          : "Supports: JPG, PNG, WebP (Max 5MB each)"}
                      </p>
                      <input
                        id="image-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            handleImageUpload(e.target.files)
                          }
                        }}
              />
            </div>

                    {errors.images && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errors.images}</AlertDescription>
                      </Alert>
                    )}

                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border-2 border-border"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  // Preview functionality could be added here
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button type="button" size="sm" variant="destructive" onClick={() => removeImage(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {index === 0 && <Badge className="absolute -top-2 -left-2 bg-primary">Main</Badge>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Pricing Tab */}
                <TabsContent value="pricing" className="space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                          <TrendingUp className="h-6 w-6 text-primary" />
                          Pricing Information
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="originalPrice" className="font-semibold">
                              Original Price *
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-muted-foreground">Rs</span>
              <Input
                                id="originalPrice"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.originalPrice}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    originalPrice: Number.parseFloat(e.target.value) || 0,
                                  }))
                                }
                                className={`pl-12 h-10 sm:h-12 text-base sm:text-lg ${errors.originalPrice ? "border-destructive" : ""}`}
                                placeholder="0.00"
              />
                            </div>
                            {errors.originalPrice && <p className="text-destructive text-sm">{errors.originalPrice}</p>}
            </div>

                          <div className="space-y-2">
                            <Label htmlFor="discount" className="font-semibold">
                              Discount (%)
                            </Label>
              <Input
                              id="discount"
                              type="number"
                              min="0"
                              max="100"
                              value={formData.discount}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, discount: Number.parseFloat(e.target.value) || 0 }))
                              }
                              className="h-10 sm:h-12 text-base sm:text-lg"
                              placeholder="0"
              />
            </div>
          </div>

                        <div className="space-y-2">
                          <Label htmlFor="price" className="font-semibold">
                            Sale Price *
                          </Label>
                                                      <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-muted-foreground">Rs</span>
                              <Input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.price}
                                onChange={(e) =>
                                  setFormData((prev) => ({ ...prev, price: Number.parseFloat(e.target.value) || 0 }))
                                }
                                className={`pl-12 h-10 sm:h-12 text-base sm:text-lg ${errors.price ? "border-destructive" : ""}`}
                                placeholder="0.00"
                              />
            </div>
                          {errors.price && <p className="text-destructive text-sm">{errors.price}</p>}
          </div>

                        <div className="space-y-2">
                          <Label htmlFor="totalStock" className="font-semibold">
                            Total Stock *
                          </Label>
            <Input
              id="totalStock"
              type="number"
              min="0"
              value={formData.totalStock}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, totalStock: Number.parseInt(e.target.value) || 0 }))
                            }
                            className={`h-10 sm:h-12 text-base sm:text-lg ${errors.totalStock ? "border-destructive" : ""}`}
                            placeholder="0"
                          />
                          {errors.totalStock && <p className="text-destructive text-sm">{errors.totalStock}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <Card className="bg-muted/50 border-border">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">Rs</span>
                            Pricing Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Original Price:</span>
                            <span className="font-semibold text-lg">Rs {formData.originalPrice.toFixed(2)}</span>
                          </div>

                          {formData.discount > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Discount:</span>
                              <span className="font-semibold text-destructive">-{formData.discount}%</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-xl font-bold border-t pt-4">
                            <span>Sale Price:</span>
                            <span className="text-primary">Rs {formData.price.toFixed(2)}</span>
                          </div>

                          {formData.originalPrice > 0 &&
                            formData.price > 0 &&
                            formData.originalPrice !== formData.price && (
                              <div className="text-center">
                                <Badge variant="secondary" className="bg-primary/10 text-primary">
                                  You save Rs {(formData.originalPrice - formData.price).toFixed(2)}
                                </Badge>
                              </div>
                            )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                                          <div className="space-y-4">
                        <h4 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                          <Ruler className="h-5 w-5 text-primary" />
                          Sizes
                        </h4>
                                            <Textarea
                        value={inputValues.sizes}
                        onChange={(e) => handleInputChange("sizes", e.target.value)}
                        onKeyDown={(e) => handleKeyDown("sizes", e)}
                        placeholder="Type a size and press Enter to add&#10;Example: XS (then press Enter)&#10;Then: S (then press Enter)&#10;Or use commas: XS, S, M, L, XL"
                        className="h-24 text-sm"
                      />
                                              <p className="text-sm text-muted-foreground">Type and press Enter to add, or use commas to separate multiple items</p>
                        {formData.sizes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.sizes.map((size, index) => (
                            <Badge key={index} variant="outline" className="flex items-center gap-1 pr-1">
                              {size}
                              <button
                                type="button"
                                onClick={() => removeItem("sizes", index)}
                                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
          </div>

                    <div className="space-y-4">
                      <h4 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        Colors
                      </h4>
            <Textarea
                        value={inputValues.colors}
                        onChange={(e) => handleInputChange("colors", e.target.value)}
                        onKeyDown={(e) => handleKeyDown("colors", e)}
                        placeholder="Type a color and press Enter to add&#10;Example: Red (then press Enter)&#10;Then: Blue (then press Enter)&#10;Or use commas: Red, Blue, Green, Black"
                        className="h-24 text-sm"
                      />
                                              <p className="text-sm text-muted-foreground">Type and press Enter to add, or use commas to separate multiple items</p>
                                                {formData.colors.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {formData.colors.map((color, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="bg-primary/5 flex items-center gap-1 pr-1"
                              >
                                {color}
                                <button
                                  type="button"
                                  onClick={() => removeItem("colors", index)}
                                  className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
          </div>

                    <div className="space-y-4">
                      <h4 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                        <Star className="h-5 w-5 text-primary" />
                        Features
                      </h4>
                      <Textarea
                        value={inputValues.features}
                        onChange={(e) => handleInputChange("features", e.target.value)}
                        onKeyDown={(e) => handleKeyDown("features", e)}
                        placeholder="Type a feature and press Enter to add&#10;Example: Waterproof (then press Enter)&#10;Then: Durable (then press Enter)&#10;Or use commas: Waterproof, Durable, Lightweight"
                        className="h-24 text-sm"
                      />
                                                                      <p className="text-sm text-muted-foreground">Type and press Enter to add, or use commas to separate multiple items</p>
                                                {formData.features.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {formData.features.map((feature, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="bg-primary/5 flex items-center gap-1 pr-1"
                              >
                                {feature}
                                <button
                                  type="button"
                                  onClick={() => removeItem("features", index)}
                                  className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Form Actions */}
              <div className="flex gap-4 pt-8 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1 h-12 text-lg bg-transparent"
                  disabled={loading}
                >
              Cancel
            </Button>
                <Button
                  type="submit"
                  className="flex-1 h-10 sm:h-12 text-base sm:text-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Saving Product...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Save Product
                    </>
                  )}
            </Button>
          </div>
        </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AddProductForm