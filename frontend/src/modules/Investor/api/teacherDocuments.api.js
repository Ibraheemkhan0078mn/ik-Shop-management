import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@shared/services/axiosInstance.js";




async function uploadTeacherDocument(payload) {
    try {
        const res = await api.post("/memberRoutes/uploadTeacherDocuments", payload, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        return res.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const useUploadTeacherDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: uploadTeacherDocument,
        onSuccess: (data, payload) => {
            // ;
            // Invalidate specific teacher data to refresh documents
            queryClient.invalidateQueries({ queryKey: ["teacherData", payload.get("teacherDocId")], exact: true });
        }
    });
}






















async function deleteTeacherDocument(payload) {
    try {
        const res = await api.post("/memberRoutes/deleteTeacherDocument", payload);
        return res.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const useDeleteTeacherDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteTeacherDocument,
        onSuccess: (data, payload) => {
            ;
            // Invalidate specific teacher data to refresh documents
            queryClient.invalidateQueries({ queryKey: ["teacherData", payload.teacherDocId], exact: true });
        }
    });
}