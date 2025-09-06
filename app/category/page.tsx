"use client";

import { MoreHorizontal, Plus } from "lucide-react";
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
import AdminLayout from "../adminLayout/adminLayout";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { fetchCategoryItems, handleCategoryItemDelete, addCategory, handleUpdateCategory } from "@/store/categoriesSlice";
import { Status } from "@/store/authSlice";
import { useRouter } from "next/navigation";

export default function CategoryTable() {
  const { items, status } = useAppSelector((store) => store.category);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [categoryName, setCategoryName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    dispatch(fetchCategoryItems());
  }, [dispatch]);

  const handleCategorySubmit = () => {
    if (!categoryName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    if (editCategoryId) {
      dispatch(handleUpdateCategory(editCategoryId, categoryName))
        .then(() => {
          toast.success("Category updated successfully");
          setEditCategoryId(null);
          setCategoryName("");
          setOpenDialog(false); // Close dialog after successful update
          router.refresh(); // Refresh page to show updated data
        })
        .catch((error) => {
          toast.error(error.message || "Failed to update category");
        });
    } else {
      dispatch(addCategory(categoryName))
        .then(() => {
          toast.success("Category added successfully");
          setCategoryName("");
          setOpenDialog(false);
          router.refresh(); // Refresh page to show new data
        })
        .catch((error) => {
          toast.error(error.message || "Failed to add category");
        });
    }
  };

  const deleteCategory = (id: string) => {
    dispatch(handleCategoryItemDelete(id))
      .then(() => {
        toast.success("Category deleted successfully");
        setOpenDialog(false); // Close dialog if open
        router.refresh(); // Refresh page to show updated data
      })
      .catch((error) => {
        toast.error(error.message || "Failed to delete category");
      });
  };

  return (
    <AdminLayout>
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Manage your product categories and view their details.</CardDescription>
          </div>
          <Dialog open={openDialog} onOpenChange={(open) => {
            if (!open) setEditCategoryId(null);
            setCategoryName("");
            setOpenDialog(open);
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1">
                <Plus className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Category</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editCategoryId ? "Edit Category" : "Add New Category"}</DialogTitle>
                <DialogDescription>
                  {editCategoryId ? "Update the category name below." : "Enter a name for the new category."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Input
                    id="categoryName"
                    placeholder="Enter category name"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                  />
                </div>
                <Button onClick={handleCategorySubmit} disabled={status === Status.LOADING}>
                  {status === Status.LOADING ? "Processing..." : editCategoryId ? "Update Category" : "Add Category"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead className="hidden md:table-cell">ID</TableHead>
                <TableHead className="hidden md:table-cell">Created At</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.categoryName}</TableCell>
                  <TableCell className="hidden md:table-cell">{category.id}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Date(category.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
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
                        <DropdownMenuItem
                          onClick={() => {
                            setEditCategoryId(category.id);
                            setCategoryName(category.categoryName);
                            setOpenDialog(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => deleteCategory(category.id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-{items.length}</strong> of <strong>{items.length}</strong> categories
          </div>
        </CardFooter>
      </Card>
    </AdminLayout>
  );
}