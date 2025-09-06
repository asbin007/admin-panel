"use client";

import { MoreHorizontal, Trash2, AlertCircle, Loader2, Eye, MessageSquare } from "lucide-react";
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
  DropdownMenuSeparator,
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
} from "@/components/ui/alert-dialog";
import AdminLayout from "../adminLayout/adminLayout";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useEffect, useState } from "react";
import { deleteUserById, fetchUsers } from "@/store/authSlice";
import { toast } from "sonner";
import { checkBackendWithFallback } from "@/utils/backendHealthCheck";

export default function UserTable() {
  const { user: users } = useAppSelector((store) => store.auth);
  const dispatch = useAppDispatch();
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleDeleteUser = async (id: string, username: string): Promise<{ success: boolean; error?: string }> => {
    if (!id) {
      toast.error("Invalid user ID");
      return { success: false, error: "Invalid user ID" };
    }

    try {
      setDeletingUserId(id);
      setDialogOpen(prev => ({ ...prev, [id as string]: false })); // Close dialog
      
      console.log(`🗑️ Deleting user: ${username} (ID: ${id})`);
      
      // Check backend health before attempting delete
      console.log('🏥 Checking backend health before delete...');
      const healthCheck = await checkBackendWithFallback();
      
      if (!healthCheck.isHealthy) {
        console.error('❌ Backend health check failed:', healthCheck);
        toast.error('Backend server is not responding', {
          description: `Server status: ${healthCheck.status}. Please check if your backend server is running.`,
          duration: 6000,
        });
        return { success: false, error: 'Backend server is not responding' };
      }
      
      console.log('✅ Backend health check passed, proceeding with delete');
      
      // Dispatch the delete action
      const result = await dispatch(deleteUserById(id)) as { success?: boolean; error?: string };
      
      if (result.success !== false) {
        console.log(`✅ User "${username}" deleted successfully`);
        toast.success(`User "${username}" deleted successfully!`, {
          description: 'The user has been permanently removed from the system.',
          duration: 4000,
        });
        return { success: true };
      } else {
        console.error(`❌ Failed to delete user "${username}":`, result.error);
        
        // Show specific error message based on the error type
        let errorDescription = result.error || 'Please try again';
        let errorTitle = `Failed to delete user "${username}"`;
        
        if (result.error?.includes('related data')) {
          errorTitle = `Cannot delete user "${username}"`;
          errorDescription = 'This user has related data (orders, chats, reviews). Please delete their related data first or contact support for assistance.';
        }
        
        toast.error(errorTitle, {
          description: errorDescription,
          duration: 6000,
        });
        return { success: false, error: result.error || 'Failed to delete user' };
      }
    } catch (error: unknown) {
      console.error(`❌ Error deleting user "${username}":`, error);
      
      // Handle different types of errors
      let errorMessage = "Failed to delete user. Please try again.";
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 500) {
          // Check if it's a foreign key constraint error
          const errorData = axiosError.response?.data;
          if (errorData?.message && errorData.message.includes('foreign key constraint')) {
            errorMessage = "Cannot delete user because they have related data (chats, orders, etc.). Please contact support.";
          } else {
            errorMessage = "Server error (500). The backend server encountered an internal error. Please check your Render dashboard for server logs.";
          }
          // Refresh users list to get latest data
          dispatch(fetchUsers());
        } else if (axiosError.response?.status === 404) {
          errorMessage = "User not found. It may have already been deleted.";
        } else if (axiosError.response?.status === 403) {
          errorMessage = "You don't have permission to delete this user.";
        } else if (axiosError.response?.status === 400) {
          errorMessage = "Cannot delete this user due to existing dependencies.";
        }
      }
      
      toast.error(`Failed to delete user "${username}"`, {
        description: errorMessage,
        duration: 6000,
      });
      
      return { success: false, error: errorMessage };
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
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-gray-100 p-3 mb-4">
                <AlertCircle className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500 max-w-sm">
                There are no users in the system yet. Users will appear here once they register.
              </p>
            </div>
          ) : (
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
                <TableRow 
                  key={user.id}
                  className={deletingUserId === user.id ? "opacity-50 bg-gray-50" : ""}
                >
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>

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
                        <DropdownMenuItem
                          onClick={() => {
                            // Navigate to user's related data page
                            window.open(`/orders?userId=${user.id}`, '_blank');
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Orders
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            // Navigate to user's chat data
                            window.open(`/chat?userId=${user.id}`, '_blank');
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          View Chats
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog 
                          open={dialogOpen[user.id || ''] || false}
                          onOpenChange={(open) => {
                            if (user.id) {
                              setDialogOpen(prev => ({ ...prev, [user.id as string]: open }));
                            }
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              disabled={deletingUserId === user.id}
                              onSelect={(e) => {
                                e.preventDefault();
                                if (user.id) {
                                  setDialogOpen(prev => ({ ...prev, [user.id as string]: true }));
                                }
                              }}
                            >
                              {deletingUserId === user.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
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
                                Are you sure you want to delete user <strong>&quot;{user.username}&quot;</strong>? 
                                This action cannot be undone and will permanently remove the user from the system.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                onClick={() => {
                                  if (user.id) {
                                    setDialogOpen(prev => ({ ...prev, [user.id as string]: false }));
                                  }
                                }}
                              >
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => user.id && handleDeleteUser(user.id, user.username || "Unknown")}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={deletingUserId === user.id}
                              >
                                {deletingUserId === user.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  'Delete User'
                                )}
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
          )}
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
