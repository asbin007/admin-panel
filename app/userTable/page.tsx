"use client";

import { MoreHorizontal, Trash2, AlertCircle } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/dialog";
import AdminLayout from "../adminLayout/adminLayout";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useEffect, useState } from "react";
import { deleteUserById, fetchUsers } from "@/store/authSlice";
import toast from "react-hot-toast";

export default function UserTable() {
  const { user: users } = useAppSelector((store) => store.auth);
  const dispatch = useAppDispatch();
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleDeleteUser = async (id: string, username: string) => {
    try {
      setDeletingUserId(id);
      
      // Show success toast immediately
      toast.success(`User "${username}" deleted successfully!`);
      
      // Dispatch the delete action
      await dispatch(deleteUserById(id));
      
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user. Please try again.");
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage your users and view their details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>

                <TableHead className="hidden md:table-cell">ID</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>

                  <TableCell className="hidden md:table-cell">
                    {user.id}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              disabled={deletingUserId === user.id}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {deletingUserId === user.id ? "Deleting..." : "Delete"}
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                                Delete User
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete user <strong>"{user.username}"</strong>? 
                                This action cannot be undone and will permanently remove the user from the system.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => user.id && handleDeleteUser(user.id, user.username || "Unknown")}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete User
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
            Showing <strong>1-{users.length}</strong> of{" "}
            <strong>{users.length}</strong> users
          </div>
        </CardFooter>
      </Card>
    </AdminLayout>
  );
}
