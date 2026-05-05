import {createSlice} from '@reduxjs/toolkit'



const teacherSlice= createSlice({
    name: "teacher",
    initialState:{
        teacherSalaryPayments:[]
    },
    reducers:{
        setTeacherSalaryPayment: (state, action)=>{
            state.teacherSalaryPayments = action.payload
        }
  
  
    }
})




export const { setTeacherSalaryPayment}= teacherSlice.actions
export default teacherSlice.reducer