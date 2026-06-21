// src/modules/expense/services/expense.service.js
import { baseApi } from "@app/rtkBaseApi.js";

export const expenseApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        // paginated list — /getExpense/:skip/:limit/:date
        getExpenses: build.query({
            query: ({ skip = 0, limit = 20, date = "none" } = {}) => ({
                url: `/api/expenseRoutes/getExpense/${skip}/${limit}/${date}`,
            }),
            transformResponse: (raw) => raw.expenses ?? raw.data ?? [],
            providesTags: ["Expense"],
        }),

        createExpense: build.mutation({
            query: (body) => ({ url: "/api/expenseRoutes/expense", method: "POST", body }),
            invalidatesTags: ["Expense"],
        }),

        updateExpense: build.mutation({
            query: (body) => ({ url: "/api/expenseRoutes/expense", method: "PUT", body }),
            invalidatesTags: ["Expense"],
        }),

        deleteExpense: build.mutation({
            query: (id) => ({ url: "/api/expenseRoutes/expense", method: "DELETE", body: { _id: id } }),
            invalidatesTags: ["Expense"],
        }),

        // categories
        getExpenseCategories: build.query({
            query: () => ({ url: "/api/expenseRoutes/expenseCatagGetAll" }),
            transformResponse: (raw) => raw.expenseCatags ?? raw.data ?? [],
            providesTags: ["ExpenseCategory"],
        }),

        createExpenseCategory: build.mutation({
            query: (catagName) => ({ url: "/api/expenseRoutes/expenseCatagCreate", method: "POST", body: { catagName } }),
            invalidatesTags: ["ExpenseCategory"],
        }),

        deleteExpenseCategory: build.mutation({
            query: (id) => ({ url: `/api/expenseRoutes/expenseCatagDelete/${id}`, method: "DELETE" }),
            invalidatesTags: ["ExpenseCategory"],
        }),
    }),
});

export const {
    useGetExpensesQuery:            useExpenses,
    useCreateExpenseMutation:       useCreateExpense,
    useUpdateExpenseMutation:       useUpdateExpense,
    useDeleteExpenseMutation:       useDeleteExpense,
    useGetExpenseCategoriesQuery:   useExpenseCategories,
    useCreateExpenseCategoryMutation: useCreateExpenseCategory,
    useDeleteExpenseCategoryMutation: useDeleteExpenseCategory,
} = expenseApi;
