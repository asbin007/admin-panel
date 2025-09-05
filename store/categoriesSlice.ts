import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Status } from "./authSlice";
import { AppDispatch } from "./store";
import { API, APIS } from "@/globals/http";

interface ICategory {
    id: string;
    categoryName: string;
    createdAt: string;
}

interface IInitialState {
    items: ICategory[];
    status: Status;
}

const initialState: IInitialState = {
    items: [],
    status: Status.LOADING
};

const categoriesSlice = createSlice({
    name: "category",
    initialState,
    reducers: {
        setItems(state: IInitialState, action: PayloadAction<ICategory[]>) {
            state.items = action.payload;
        },
        setStatus(state: IInitialState, action: PayloadAction<Status>) {
            state.status = action.payload;
        },
        addCategoryToItem(state: IInitialState, action: PayloadAction<ICategory>) {
            state.items.push(action.payload);
        },
        deleteCategory(state: IInitialState, action: PayloadAction<string>) {
            const index = state.items.findIndex(item => item.id === action.payload);
            if (index !== -1) {
                state.items.splice(index, 1);
            }
        },
        updateCategory(state: IInitialState, action: PayloadAction<ICategory>) {
            const index = state.items.findIndex(item => item.id === action.payload.id);
            if (index !== -1) {
                state.items[index] = action.payload;
            }
        },
        resetStatus(state: IInitialState) {
            state.status = Status.LOADING;
        }
    }
});

export const { setItems, setStatus, addCategoryToItem, deleteCategory, updateCategory, resetStatus } = categoriesSlice.actions;
export default categoriesSlice.reducer;

export function addCategory(categoryName: string) {
    return async function addCategoryThunk(dispatch: AppDispatch) {
        try {
            const response = await APIS.post("/category", { categoryName });
            if (response.status === 200) {
                dispatch(setStatus(Status.SUCCESS));
                dispatch(addCategoryToItem(response.data.data));
            } else {
                dispatch(setStatus(Status.ERROR));
            }
        } catch (error) {
            console.log(error);
            dispatch(setStatus(Status.ERROR));
        }
    };
}

export function fetchCategoryItems() {
    return async function fetchCategoryItemsThunk(dispatch: AppDispatch) {
        try {
            console.log("Fetching categories from /category endpoint...");
            const response = await APIS.get("/category");
            
            console.log("Categories response:", response.status, response.data);
            
            if (response && (response.status === 200 || response.status === 201)) {
                const categories = response.data.data || response.data || [];
                console.log("Categories data:", categories);
                dispatch(setItems(categories));
                dispatch(setStatus(Status.SUCCESS));
            } else {
                console.log("Categories response not successful:", response);
                dispatch(setStatus(Status.ERROR));
                dispatch(setItems([]));
            }
        } catch (error: any) {
            console.error("Categories fetch error:", error);
            console.error("Error details:", {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            
            // If 404, try alternative endpoint
            if (error.response?.status === 404) {
                try {
                    console.log("Trying /categories endpoint...");
                    const response = await APIS.get("/categories");
                    if (response && (response.status === 200 || response.status === 201)) {
                        const categories = response.data.data || response.data || [];
                        dispatch(setItems(categories));
                        dispatch(setStatus(Status.SUCCESS));
                        return;
                    }
                } catch (secondError) {
                    console.error("Second attempt failed:", secondError);
                }
            }
            
            dispatch(setStatus(Status.ERROR));
            dispatch(setItems([]));
        }
    };
}

export function handleCategoryItemDelete(categoryId: string) {
    return async function handleCategoryItemDeleteThunk(dispatch: AppDispatch) {
        try {
            const response = await APIS.delete("/category/" + categoryId);
            if (response.status === 200) {
                dispatch(deleteCategory(categoryId)); // Fixed from setDeleteCategoryItem
                dispatch(setStatus(Status.SUCCESS));
            } else {
                dispatch(setStatus(Status.ERROR));
            }
        } catch (error) {
            console.log(error);
            dispatch(setStatus(Status.ERROR));
        }
    };
}

export function handleUpdateCategory(categoryId: string, categoryName: string) {
    return async function handleUpdateCategoryThunk (dispatch: AppDispatch) {
        try {
            const response = await APIS.patch(`/category/${categoryId}`, { categoryName });
            if (response.status === 200) {
                dispatch(setStatus(Status.SUCCESS));
                dispatch(updateCategory(response.data.data));
            } else {
                dispatch(setStatus(Status.ERROR));
            }
        } catch (error) {
            console.log(error);
            dispatch(setStatus(Status.ERROR));
        }
    };
}