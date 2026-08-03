import { createSlice } from "@reduxjs/toolkit";



let expenseSlice = createSlice({
    name: "expense",
    initialState: {
        allExpenseCatags: []
    },
    reducers: {
        setAllExpenseCatags: (state, action) => {
            state.allExpenseCatags = action.payload
        }
    }
})



export default expenseSlice.reducer
export const { setAllExpenseCatags } = expenseSlice.actions