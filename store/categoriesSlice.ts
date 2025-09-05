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
            // Try multiple endpoints
            let response;
            try {
                response = await API.get("/categories");
            } catch (firstError) {
                console.log("Trying /category endpoint...");
                try {
                    response = await API.get("/category");
                } catch (secondError) {
                    console.log("Trying /admin/categories endpoint...");
                    response = await API.get("/admin/categories");
                }
            }
            
            if (response && (response.status === 200 || response.status === 201)) {
                dispatch(setItems(response.data.data || response.data || []));
                dispatch(setStatus(Status.SUCCESS));
            } else {
                dispatch(setStatus(Status.ERROR));
                dispatch(setItems([]));
            }
        } catch (error) {
            console.log("Categories fetch error:", error);
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