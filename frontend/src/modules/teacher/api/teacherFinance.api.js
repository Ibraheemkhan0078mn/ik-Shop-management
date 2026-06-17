import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@shared/services/axiosInstance.js";


async function teacherFinanceRecordFetch(id) {
    try {
        let res = await api.post("/memberRoutes/getTeacherFinanceData", { teacherId: id })
        return res.data.data || null
    } catch (error) {
        console.error(error)
    }
}

// Mutation setup to fetch teacher financial data
export const useGetTeacherFinancialRecord = (id, options = {}) => {
    return useQuery({
        queryKey: ["teacherFinanceData", id],
        queryFn: () => teacherFinanceRecordFetch(id),
        ...options
    })
}


















async function createTeacherSalaryPayments(payload) {
    try {
        const res = await api.post(`/memberRoutes/createTeacherSalaryPayment`, payload);
        return res.data
    } catch (error) {
        console.error(error)
    }
}




export const useCreateTeacherSalary = () => {
    let queryClient = useQueryClient()
    return useMutation({
        mutationFn: createTeacherSalaryPayments,
        onSuccess: (data, payload) => {
            queryClient.invalidateQueries({ queryKey: ["teacherFinanceData", payload.teacherId], exact: true })
        }
    })
}























async function recalculateTeacherFinancials(teacherId) {
    try {
        const res = await api.post("/memberRoutes/recalculateAndRefiltTeacherInvoicesAll", { teacherId });
        return res.data;
    } catch (error) {
        console.error(error);
        throw error; // Important: re-throw to let React Query handle the error
    }
}

export const useRecalculateTeacherFinancials = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: recalculateTeacherFinancials,
        onSuccess: (data, teacherId) => {
            ;
            // Invalidate teacher finance data to refresh it
            queryClient.invalidateQueries({ queryKey: ["teacherFinanceData", teacherId], exact: true });
        }
    });
}






























async function deleteSalaryPayment({ paymentId, teacherId }) {
    try {
        const res = await api.delete("/memberRoutes/deleteSalaryPayment", { data: { salaryId: paymentId, teacherId } });
        return res.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const useDeleteSalaryPayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteSalaryPayment,
        onSuccess: (data, paymentId) => {
            // ;
            // Invalidate teacher finance data to refresh it
            queryClient.invalidateQueries({ queryKey: ["teacherFinanceData"] });
        }
    });
}