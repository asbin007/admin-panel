import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { APIS } from "../globals/http";
import { Status } from "./authSlice";

export interface Admin {
  id: string;
  username: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalAdmins: number;
  activeAdmins: number;
  inactiveAdmins: number;
  totalCustomers: number;
  adminToCustomerRatio: string;
}

export interface AdminPagination {
  currentPage: number;
  totalPages: number;
  totalAdmins: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface AdminManagementState {
  admins: Admin[];
  selectedAdmin: Admin | null;
  stats: AdminStats | null;
  pagination: AdminPagination | null;
  loading: boolean;
  error: string | null;
  status: Status;
  searchQuery: string;
  statusFilter: 'all' | 'active' | 'inactive';
  selectedAdmins: string[];
}

const initialState: AdminManagementState = {
  admins: [],
  selectedAdmin: null,
  stats: null,
  pagination: null,
  loading: false,
  error: null,
  status: Status.LOADING,
  searchQuery: '',
  statusFilter: 'all',
  selectedAdmins: [],
};

const adminManagementSlice = createSlice({
  name: "adminManagement",
  initialState,
  reducers: {
    setAdmins: (state, action: PayloadAction<Admin[]>) => {
      state.admins = action.payload;
    },
    setSelectedAdmin: (state, action: PayloadAction<Admin | null>) => {
      state.selectedAdmin = action.payload;
    },
    setStats: (state, action: PayloadAction<AdminStats>) => {
      state.stats = action.payload;
    },
    setPagination: (state, action: PayloadAction<AdminPagination>) => {
      state.pagination = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setStatus: (state, action: PayloadAction<Status>) => {
      state.status = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<'all' | 'active' | 'inactive'>) => {
      state.statusFilter = action.payload;
    },
    setSelectedAdmins: (state, action: PayloadAction<string[]>) => {
      state.selectedAdmins = action.payload;
    },
    toggleAdminSelection: (state, action: PayloadAction<string>) => {
      const adminId = action.payload;
      if (state.selectedAdmins.includes(adminId)) {
        state.selectedAdmins = state.selectedAdmins.filter(id => id !== adminId);
      } else {
        state.selectedAdmins.push(adminId);
      }
    },
    clearSelectedAdmins: (state) => {
      state.selectedAdmins = [];
    },
    updateAdminInList: (state, action: PayloadAction<Admin>) => {
      const index = state.admins.findIndex(admin => admin.id === action.payload.id);
      if (index !== -1) {
        state.admins[index] = action.payload;
      }
    },
    removeAdminFromList: (state, action: PayloadAction<string>) => {
      state.admins = state.admins.filter(admin => admin.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Admins
      .addCase(fetchAdmins.pending, (state) => {
        state.loading = true;
        state.status = Status.LOADING;
        state.error = null;
      })
      .addCase(fetchAdmins.fulfilled, (state, action) => {
        state.loading = false;
        state.status = Status.SUCCESS;
        state.admins = action.payload.admins;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchAdmins.rejected, (state, action) => {
        state.loading = false;
        state.status = Status.ERROR;
        state.error = action.payload as string || 'Failed to fetch admins';
      })
      // Fetch Admin Stats
      .addCase(fetchAdminStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch admin stats';
      })
      // Create Admin
      .addCase(createAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.admins.unshift(action.payload);
        state.error = null;
      })
      .addCase(createAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to create admin';
      })
      // Update Admin
      .addCase(updateAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAdmin.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.admins.findIndex(admin => admin.id === action.payload.id);
        if (index !== -1) {
          state.admins[index] = action.payload;
        }
        if (state.selectedAdmin?.id === action.payload.id) {
          state.selectedAdmin = action.payload;
        }
        state.error = null;
      })
      .addCase(updateAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to update admin';
      })
      // Promote to Admin
      .addCase(promoteToAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(promoteToAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.admins.unshift(action.payload);
        state.error = null;
      })
      .addCase(promoteToAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to promote user to admin';
      })
      // Demote Admin
      .addCase(demoteAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(demoteAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.admins = state.admins.filter(admin => admin.id !== action.payload);
        state.selectedAdmins = state.selectedAdmins.filter(id => id !== action.payload);
        if (state.selectedAdmin?.id === action.payload) {
          state.selectedAdmin = null;
        }
        state.error = null;
      })
      .addCase(demoteAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to demote admin';
      })
      // Delete Admin
      .addCase(deleteAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.admins = state.admins.filter(admin => admin.id !== action.payload);
        state.selectedAdmins = state.selectedAdmins.filter(id => id !== action.payload);
        if (state.selectedAdmin?.id === action.payload) {
          state.selectedAdmin = null;
        }
        state.error = null;
      })
      .addCase(deleteAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to delete admin';
      })
      // Bulk Update
      .addCase(bulkUpdateAdmins.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkUpdateAdmins.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedAdmins = [];
        state.error = null;
      })
      .addCase(bulkUpdateAdmins.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to perform bulk update';
      });
  },
});

export const {
  setAdmins,
  setSelectedAdmin,
  setStats,
  setPagination,
  setLoading,
  setError,
  setStatus,
  setSearchQuery,
  setStatusFilter,
  setSelectedAdmins,
  toggleAdminSelection,
  clearSelectedAdmins,
  updateAdminInList,
  removeAdminFromList,
} = adminManagementSlice.actions;

// Async Thunks
export const fetchAdmins = createAsyncThunk(
  'adminManagement/fetchAdmins',
  async (params: { page?: number; limit?: number; search?: string; status?: string } = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, search = '', status = 'all' } = params;
      const response = await APIS.get('/auth/admin-management/admins', {
        params: { page, limit, search, status }
      });
      
      if (response.status === 200) {
        return response.data.data;
      } else {
        return rejectWithValue('Failed to fetch admins');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch admins');
    }
  }
);

export const fetchAdminStats = createAsyncThunk(
  'adminManagement/fetchAdminStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await APIS.get('/auth/admin-management/stats');
      
      if (response.status === 200) {
        return response.data.data;
      } else {
        return rejectWithValue('Failed to fetch admin stats');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch admin stats');
    }
  }
);

export const createAdmin = createAsyncThunk(
  'adminManagement/createAdmin',
  async (adminData: { username: string; email: string; password: string; isVerified?: boolean }, { rejectWithValue }) => {
    try {
      const response = await APIS.post('/auth/admin/register', adminData);
      
      if (response.status === 201) {
        return response.data;
      } else {
        return rejectWithValue('Failed to create admin');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create admin');
    }
  }
);

export const updateAdmin = createAsyncThunk(
  'adminManagement/updateAdmin',
  async ({ id, adminData }: { id: string; adminData: Partial<Admin> }, { rejectWithValue }) => {
    try {
      const response = await APIS.put(`/auth/admin-management/admins/${id}`, adminData);
      
      if (response.status === 200) {
        return response.data.data;
      } else {
        return rejectWithValue('Failed to update admin');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update admin');
    }
  }
);

export const promoteToAdmin = createAsyncThunk(
  'adminManagement/promoteToAdmin',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await APIS.post('/auth/admin-management/promote', { userId });
      
      if (response.status === 200) {
        return response.data.data;
      } else {
        return rejectWithValue('Failed to promote user to admin');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to promote user to admin');
    }
  }
);

export const demoteAdmin = createAsyncThunk(
  'adminManagement/demoteAdmin',
  async (adminId: string, { rejectWithValue }) => {
    try {
      const response = await APIS.put(`/auth/admin-management/admins/${adminId}/demote`);
      
      if (response.status === 200) {
        return adminId;
      } else {
        return rejectWithValue('Failed to demote admin');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to demote admin');
    }
  }
);

export const deleteAdmin = createAsyncThunk(
  'adminManagement/deleteAdmin',
  async (adminId: string, { rejectWithValue }) => {
    try {
      const response = await APIS.delete(`/auth/admin-management/admins/${adminId}`);
      
      if (response.status === 200) {
        return adminId;
      } else {
        return rejectWithValue('Failed to delete admin');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete admin');
    }
  }
);

export const bulkUpdateAdmins = createAsyncThunk(
  'adminManagement/bulkUpdateAdmins',
  async ({ adminIds, action }: { adminIds: string[]; action: string }, { rejectWithValue }) => {
    try {
      const response = await APIS.post('/auth/admin-management/bulk', { adminIds, action });
      
      if (response.status === 200) {
        return response.data;
      } else {
        return rejectWithValue('Failed to perform bulk update');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to perform bulk update');
    }
  }
);

export default adminManagementSlice.reducer;
