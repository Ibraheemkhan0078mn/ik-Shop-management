import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import api from "@shared/services/axiosInstance.js"

// Get All Partner Investments
// async function getAllPartnerInvestments() {
//     try {
//         let res = await api.get("/partnerInvestmentRoute/getAllPartnerInvestments")
//         return res.data.investments || []
//     } catch (error) {
//         console.error(error?.message, error?.stack)
//         throw error
//     }
// }

// export const useGetAllPartnerInvestments = () => {
//     return useQuery({
//         queryKey: ["allPartnerInvestments"],
//         queryFn: getAllPartnerInvestments
//     })
// }


























// Get Partner Investment by ID
// async function getPartnerInvestmentById(id) {
//     try {
//         let res = await api.get(`/memberRoutes/getPartnerInvestmentById/${id}`)
//         return res.data.investment || null
//     } catch (error) {
//         console.error(error?.message, error?.stack)
//         throw error
//     }
// }

// export const useGetPartnerInvestmentById = (id) => {
//     return useQuery({
//         queryKey: ["partnerInvestment", id],
//         queryFn: () => getPartnerInvestmentById(id),
//         enabled: !!id
//     })
// }





















// Get Investments by Partner ID
async function getInvestmentsByPartnerId(partnerId) {
    try {
        let res = await api.get(`/memberRoutes/getInvestmentsByPartnerId/${partnerId}`)
        return {
            investments: res.data.investments || [],
            totalInvestment: res.data.totalInvestment || 0,
            partnerName: res.data.partnerName || "",
            count: res.data.count || 0
        }
    } catch (error) {
        console.error(error?.message, error?.stack)
        throw error
    }
}

export const useGetInvestmentsByPartnerId = (partnerId) => {
    return useQuery({
        queryKey: ["partnerInvestments", partnerId],
        queryFn: () => getInvestmentsByPartnerId(partnerId),
        enabled: !!partnerId
    })
}


















// Create Partner Investment
async function partnerInvestmentCreationFunction(payload) {
    try {
        let res = await api.post("/memberRoutes/partnerInvestmentCreation", payload)

        return res.data
    } catch (error) {
        console.error(error)
        throw error
    }
}

export const usePartnerInvestmentCreate = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: partnerInvestmentCreationFunction,
        onSuccess: (data) => {
            // Update all investments list
            // queryClient.setQueryData(["allPartnerInvestments"], (oldData) => {
            //     if (!oldData) return [data.createdInvestment];
            //     return [data.createdInvestment, ...oldData]
            // }
            // )

            // Update specific partner's investments list
            if (data.createdInvestment?.partnerId) {
                queryClient.setQueryData(["partnerInvestments", data.createdInvestment.partnerId], (oldData) => {
                    if (!oldData) return {
                        investments: [data.createdInvestment],
                        totalInvestment: data.createdInvestment.amount,
                        count: 1
                    };

                    return {
                        ...oldData,
                        investments: [data.createdInvestment, ...oldData.investments],
                        totalInvestment: (oldData.totalInvestment || 0) + data.createdInvestment.amount,
                        count: (oldData.count || 0) + 1
                    }
                })
            }

            // Invalidate teacher data to update investments array
            // queryClient.invalidateQueries(["allTeachers"])
        }
    })
}

























// Update Partner Investment
async function updatePartnerInvestmentFunction({ id, payload }) {
    try {
        let res = await api.put(`/memberRoutes/updatePartnerInvestment/${id}`, payload)

        return res.data
    } catch (error) {
        console.error(error)
        throw error
    }
}

export const usePartnerInvestmentUpdate = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updatePartnerInvestmentFunction,
        onSuccess: (data) => {
            // Update all investments list
            queryClient.setQueryData(["allPartnerInvestments"], (oldData) => {
                if (!oldData) return oldData;
                return oldData.map(inv =>
                    inv._id === data.updatedInvestment._id ? data.updatedInvestment : inv
                )
            })

            // Update single investment
            queryClient.setQueryData(["partnerInvestment", data.updatedInvestment._id], data.updatedInvestment)

            // Invalidate partner-specific investments (in case partnerId changed)
            queryClient.invalidateQueries(["partnerInvestments"])

            // Invalidate teacher data to update investments array
            // queryClient.invalidateQueries(["allTeachers"])
        }
    })
}




















// Delete Partner Investment
async function deletePartnerInvestmentFunction(id) {
    try {
        let res = await api.delete(`/memberRoutes/deletePartnerInvestment/${id}`)
        // 
        return { ...res.data, deletedId: id }
    } catch (error) {
        console.error(error)
        throw error
    }
}

export const usePartnerInvestmentDelete = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deletePartnerInvestmentFunction,
        onSuccess: (data) => {
            // Update all investments list
            queryClient.setQueryData(["allPartnerInvestments"], (oldData) => {
                if (!oldData) return oldData;
                return oldData.filter(inv => inv._id !== data.deletedId)
            })

            // Invalidate related queries
            queryClient.invalidateQueries(["partnerInvestments"])
            // queryClient.invalidateQueries(["allTeachers"])
        }
    })
}