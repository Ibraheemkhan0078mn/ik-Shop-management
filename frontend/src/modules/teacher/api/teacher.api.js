import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import api from "../../../services/axiosInstance.js"



async function getAllTeacher() {
    try {
        let res = await api.get("/memberRoutes/getAllTeachersData")
        return res.data.allTeacherData || []

    } catch (error) {
        console.error(error?.message, error?.stack)
    }
}


export const useGetAllTeacherData = () => {
    return useQuery({
        queryKey: ["allTeachers"],
        queryFn: getAllTeacher
    })
}













async function teacherCreationFunction(payload) {
    try {
        let res = await api.post("/memberRoutes/teacherCreation", payload, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })

        return res.data
    } catch (error) {
        console.error(error)
    }
}


export const useTeacherCreate = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: teacherCreationFunction,
        onSuccess: (data) => {
            queryClient.setQueryData(["allTeachers"], (oldData) => {
                if (!oldData) return oldData;

                return [data.createdTeacher, ...oldData]
            })
        }
    })
}





























async function fetchTeacherDataById(teacherId) {
    try {
        const res = await api.post(`/memberRoutes/getTeacherDataOnId`, { teacherId });
        return res.data.teacherdata || null;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const useGetTeacherDataById = (teacherId, options = {}) => {
    return useQuery({
        queryKey: ["teacherData", teacherId],
        queryFn: () => fetchTeacherDataById(teacherId),
        ...options
    });
}






















async function deleteTeacher(teacherDocId) {
    try {
        const res = await api.post("/memberRoutes/teacherDelete", { teacherDocId });
        return res.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const useDeleteTeacher = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteTeacher,
        onSuccess: (data) => {
            ;
            // Invalidate teachers list to refresh it
            queryClient.invalidateQueries({ queryKey: ["allTeachers"] });
            // Or if you have a specific query key for all teachers, use that
        }
    });
}


























async function updateTeacher(data) {
    try {
        const res = await api.post(`/memberRoutes/teacherUpdate`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const useUpdateTeacher = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateTeacher,
        onSuccess: (data, payload) => {
            // ;
            // Invalidate specific teacher data
            if (payload.get('teacherDocId')) {
                queryClient.invalidateQueries({ queryKey: ["teacherData", payload.get('teacherDocId')], exact: true });
            }
            // Invalidate all teachers list
            queryClient.invalidateQueries({ queryKey: ["allTeachers"] });
            queryClient.invalidateQueries({ queryKey: ["teacherFinanceData", payload.get('teacherDocId')] })
        }
    });
}