import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import api from "../../../services/axiosInstance.js"











// // GET ALL CLASS PARTNERSHIPS
// async function getAllClassPartnerships() {
//     try {
//         let res = await api.get("/memberRoutes/getAllClassPartnerships")
//         return res.data.partnerships || []
//     } catch (error) {
//         console.error(error?.message, error?.stack)
//     }
// }

// export const useGetAllClassPartnerships = () => {
//     return useQuery({
//         queryKey: ["allClassPartnerships"],
//         queryFn: getAllClassPartnerships
//     })
// }











// GET CLASS PARTNERSHIPS BY PARTNER ID
async function getClassPartnershipsByPartnerId(partnerId) {
    try {
        const res = await api.get(`/memberRoutes/getPartnershipsByPartnerId/${partnerId}`);
        return res.data.partnerships || [];
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const useGetClassPartnershipsByPartnerId = (partnerId, options = {}) => {
    return useQuery({
        queryKey: ["partnerClassPartnerships", partnerId],
        queryFn: () => getClassPartnershipsByPartnerId(partnerId),
        ...options
    });
}











// // GET CLASS PARTNERSHIP BY ID
// async function fetchClassPartnershipById(classPartnershipId) {
//     try {
//         const res = await api.get(`/classPartnershipRoute/getClassPartnershipById/${classPartnershipId}`);
//         return res.data.partnership || null;
//     } catch (error) {
//         console.error(error);
//         throw error;
//     }
// }

// export const useGetClassPartnershipById = (classPartnershipId, options = {}) => {
//     return useQuery({
//         queryKey: ["classPartnershipData", classPartnershipId],
//         queryFn: () => fetchClassPartnershipById(classPartnershipId),
//         ...options
//     });
// }











// CREATE CLASS PARTNERSHIP
async function classPartnershipCreationFunction(payload) {
    try {
        let res = await api.post("/memberRoutes/createClassPartnership", payload)

        return res.data
    } catch (error) {
        console.error(error)
    }
}

export const useClassPartnershipCreate = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: classPartnershipCreationFunction,
        onSuccess: (data) => {
            // queryClient.setQueryData(["allClassPartnerships"], (oldData) => {
            //     if (!oldData) return oldData;
            //     return [data.partnership, ...oldData]
            // })
            // Also invalidate partner-specific partnerships if partnerId exists
            if (data.partnership?.partnerId) {
                queryClient.invalidateQueries({ queryKey: ["partnerClassPartnerships", data.partnership.partnerId] });
            }
        }
    })
}











// UPDATE CLASS PARTNERSHIP
async function updateClassPartnership({ id, payload }) {
    try {
        // const { id, ...payload } = data;
        const res = await api.put(`/memberRoutes/updateClassPartnership/${id}`, payload);
        return res.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const useUpdateClassPartnership = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateClassPartnership,
        onSuccess: (data, payload) => {
            // Invalidate specific class partnership data
            // if (payload.id) {
            //     queryClient.invalidateQueries({ queryKey: ["classPartnershipData", payload.id], exact: true });
            // }
            // Invalidate all class partnerships list
            // queryClient.invalidateQueries({ queryKey: ["allClassPartnerships"] });
            // Invalidate partner-specific partnerships
            if (data.partnership?.partnerId) {
                queryClient.invalidateQueries({ queryKey: ["partnerClassPartnerships", data.partnership.partnerId] });
            }
        }
    });
}











// DELETE CLASS PARTNERSHIP
async function deleteClassPartnership(classPartnershipId) {
    try {
        const res = await api.delete(`/memberRoutes/deleteClassPartnership/${classPartnershipId}`);
        return res.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const useDeleteClassPartnership = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteClassPartnership,
        onSuccess: (data) => {
            // ;
            // Invalidate class partnerships list to refresh it
            // queryClient.invalidateQueries({ queryKey: ["allClassPartnerships"] });
            // Invalidate partner-specific partnerships
            if (data.partnership?.partnerId) {
                queryClient.invalidateQueries({ queryKey: ["partnerClassPartnerships", data.partnership.partnerId] });
            }
        }
    });
}