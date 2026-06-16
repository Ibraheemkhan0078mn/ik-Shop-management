import {createSlice} from '@reduxjs/toolkit'



const memberSlice= createSlice({
    name: "member",
    initialState:{
        memberSalaryPayments:[]
    },
    reducers:{
        setMemberSalaryPayment: (state, action)=>{
            state.memberSalaryPayments = action.payload
        }
  
  
    }
})




export const { setMemberSalaryPayment}= memberSlice.actions
export default memberSlice.reducer