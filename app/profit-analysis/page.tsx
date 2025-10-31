"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  BarChart3, 
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react"
import toast from "react-hot-toast"

interface ProfitData {
  id: string
  name: string
  brand: string
  sellingPrice: number
  costPrice: number
  profit: number
  profitPercentage: number
  totalStock: number
  totalProfit: number
  category: string
  collection: string
}

interface ProfitSummary {
  totalProducts: number
  totalProfit: number
  averageProfitPercentage: number
}

interface ProfitAnalysisResponse {
  products: ProfitData[]
  summary: ProfitSummary
}

const ProfitAnalysisPage: React.FC = () => {
  const [profitData, setProfitData] = useState<ProfitData[]>([])
  const [summary, setSummary] = useState<ProfitSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "profit" | "profitPercentage" | "totalProfit">("totalProfit")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [categories, setCategories] = useState<string[]>([])

  // Fetch profit analysis data
  const fetchProfitAnalysis = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("tokenauth")
      
      if (!token) {
        toast.error("Please login to view profit analysis")
        return
      }

      const response = await fetch("http://localhost:3000/api/product/profit-analysis", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        throw new Error("Failed to fetch profit analysis")
      }

      const data: { message: string; data: ProfitAnalysisResponse } = await response.json()
      setProfitData(data.data.products)
      setSummary(data.data.summary)
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data.data.products.map(p => p.category).filter(Boolean))]
      setCategories(uniqueCategories)
      
      toast.success("Profit analysis loaded successfully")
    } catch (error) {
      console.error("Error fetching profit analysis:", error)
      toast.error("Failed to load profit analysis")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfitAnalysis()
  }, [])

  // Filter and sort data
  const filteredAndSortedData = profitData
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === "all" || product.category === filterCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      let aValue: number | string
      let bValue: number | string

      switch (sortBy) {
        case "name":
          aValue = a.name
          bValue = b.name
          break
        case "profit":
          aValue = a.profit
          bValue = b.profit
          break
        case "profitPercentage":
          aValue = a.profitPercentage
          bValue = b.profitPercentage
          break
        case "totalProfit":
          aValue = a.totalProfit
          bValue = b.totalProfit
          break
        default:
          aValue = a.totalProfit
          bValue = b.totalProfit
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      return sortOrder === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
    })

  const formatCurrency = (amount: number) => `Rs ${amount.toFixed(2)}`
  const formatPercentage = (percentage: number) => `${percentage.toFixed(1)}%`

  const getProfitStatus = (profitPercentage: number) => {
    if (profitPercentage >= 50) return { color: "text-green-600", bg: "bg-green-100", icon: CheckCircle }
    if (profitPercentage >= 20) return { color: "text-yellow-600", bg: "bg-yellow-100", icon: AlertCircle }
    return { color: "text-red-600", bg: "bg-red-100", icon: XCircle }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading profit analysis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Profit Analysis
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your product profitability and business performance
          </p>
        </div>
        <Button onClick={fetchProfitAnalysis} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalProducts}</div>
              <p className="text-xs text-muted-foreground">Active products in inventory</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Potential Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalProfit)}</div>
              <p className="text-xs text-muted-foreground">If all stock is sold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Profit %</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatPercentage(summary.averageProfitPercentage)}</div>
              <p className="text-xs text-muted-foreground">Average profit margin</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Products</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={(value: "name" | "totalProfit" | "profit" | "profitPercentage") => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totalProfit">Total Profit</SelectItem>
                  <SelectItem value="profit">Profit per Unit</SelectItem>
                  <SelectItem value="profitPercentage">Profit %</SelectItem>
                  <SelectItem value="name">Product Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Order</label>
              <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">High to Low</SelectItem>
                  <SelectItem value="asc">Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Product Profit Analysis</span>
            <Badge variant="outline" className="flex items-center gap-1">
              {filteredAndSortedData.length} products
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAndSortedData.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No products found matching your criteria.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Profit/Unit</TableHead>
                    <TableHead>Profit %</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Total Profit</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedData.map((product) => {
                    const status = getProfitStatus(product.profitPercentage)
                    const StatusIcon = status.icon

                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">{product.brand}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(product.costPrice)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(product.sellingPrice)}</TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(product.profit)}
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatPercentage(product.profitPercentage)}
                        </TableCell>
                        <TableCell>{product.totalStock}</TableCell>
                        <TableCell className="font-bold text-green-600">
                          {formatCurrency(product.totalProfit)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${status.bg} ${status.color} flex items-center gap-1 w-fit`}>
                            <StatusIcon className="h-3 w-3" />
                            {product.profitPercentage >= 50 ? "Excellent" : 
                             product.profitPercentage >= 20 ? "Good" : "Low"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfitAnalysisPage
