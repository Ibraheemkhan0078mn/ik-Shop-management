import { baseApi } from "../../../store/rtkBase.js"

export const memberApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        // ─── TEACHER ───────────────────────────────────────────

        getAllMembers: build.query({
            query: () => ({
                url: "/memberRoute/getAllMembersData",
                method: "GET",
            }),
            transformResponse: (res) => res.allMemberData || [],
            providesTags: ["Member"]
        }),

        getMemberById: build.query({
            query: (memberId) => ({
                url: "/memberRoute/getMemberDataOnId",
                method: "POST",
                body: { memberId }
            }),
            transformResponse: (res) => { return res.memberdata },
            providesTags: (result, error, id) => [{ type: "Member", id }]
        }),

        createMember: build.mutation({
            query: (body) => ({
                url: "/memberRoute/memberCreation",
                method: "POST",
                body
            }),
            invalidatesTags: ["Member"]
        }),

        updateMember: build.mutation({
            query: (body) => ({
                url: "/memberRoute/memberUpdate",
                method: "POST",
                body
            }),
            invalidatesTags: (result, error, body) => [
                { type: "Member", id: body.get?.("memberDocId") },
                "Member",
                { type: "MemberFinance", id: body.get?.("memberDocId") }
            ]
        }),

        deleteMember: build.mutation({
            query: (memberDocId) => ({
                url: "/memberRoute/memberDelete",
                method: "POST",
                body: { memberDocId }
            }),
            invalidatesTags: ["Member"]
        }),

        // ─── ATTENDANCE ────────────────────────────────────────

        getMemberAttendance: build.query({
            query: (memberId) => {
                const now = new Date()
                const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
                const till = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))
                return {
                    url: "/memberRoute/fromTillTimeAttendenceCalculation",
                    method: "POST",
                    body: { memberDocId: memberId, fromDate: from, tillDate: till }
                }
            },
            providesTags: (result, error, id) => [{ type: "MemberAttendance", id }]
        }),

        // ─── DOCUMENTS ─────────────────────────────────────────

        uploadMemberDocument: build.mutation({
            query: (body) => ({
                url: "/memberRoute/uploadMemberDocuments",
                method: "POST",
                body,
                formData: true
            }),
            invalidatesTags: (result, error, body) => [{ type: "Member", id: body.get?.("memberDocId") }]
        }),

        deleteMemberDocument: build.mutation({
            query: (body) => ({
                url: "/memberRoute/deleteMemberDocument",
                method: "POST",
                body
            }),
            invalidatesTags: (result, error, body) => [{ type: "Member", id: body.memberDocId }]
        }),

        // ─── FINANCE ───────────────────────────────────────────

        getMemberFinance: build.query({
            query: (id) => ({
                url: "/memberRoute/getMemberFinanceData",
                method: "POST",
                body: { memberId: id }
            }),
            transformResponse: (res) => res || null,
            providesTags: (result, error, id) => [{ type: "MemberFinance", id }]
        }),

        createSalaryPayment: build.mutation({
            query: (body) => ({
                url: "/memberRoute/createMemberSalaryPayment",
                method: "POST",
                body
            }),
            invalidatesTags: (result, error, body) => [{ type: "MemberFinance", id: body.memberId }]
        }),

        deleteSalaryPayment: build.mutation({
            query: ({ paymentId, memberId }) => ({
                url: "/memberRoute/deleteSalaryPayment",
                method: "DELETE",
                body: { salaryId: paymentId, memberId }
            }),
            invalidatesTags: ["MemberFinance"]
        }),

        // ─── PARTNER INVESTMENT ────────────────────────────────

        getInvestmentsByPartnerId: build.query({
            query: (partnerId) => `/memberRoute/getInvestmentsByPartnerId/${partnerId}`,
            transformResponse: (res) => ({
                investments: res.investments || [],
                totalInvestment: res.totalInvestment || 0,
                partnerName: res.partnerName || "",
                count: res.count || 0
            }),
            providesTags: (result, error, id) => [{ type: "PartnerInvestment", id }]
        }),

        createPartnerInvestment: build.mutation({
            query: (body) => ({
                url: "/memberRoute/partnerInvestmentCreation",
                method: "POST",
                body
            }),
            invalidatesTags: (result, error, body) => [{ type: "PartnerInvestment", id: body.partnerId }]
        }),

        updatePartnerInvestment: build.mutation({
            query: ({ id, payload }) => ({
                url: `/memberRoute/updatePartnerInvestment/${id}`,
                method: "PUT",
                body: payload
            }),
            invalidatesTags: ["PartnerInvestment"]
        }),

        deletePartnerInvestment: build.mutation({
            query: (id) => ({
                url: `/memberRoute/deletePartnerInvestment/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["PartnerInvestment"]
        }),

        // ─── CLASS PARTNERSHIP ─────────────────────────────────

        getClassPartnershipsByPartnerId: build.query({
            query: (partnerId) => ({ url: `/memberRoute/getPartnershipsByPartnerId/${partnerId}` }),
            transformResponse: (res) => res.partnerships || [],
            providesTags: (result, error, id) => [{ type: "ClassPartnership", id }]
        }),

        createClassPartnership: build.mutation({
            query: (body) => ({
                url: "/memberRoute/createClassPartnership",
                method: "POST",
                body
            }),
            invalidatesTags: (result, error, body) => [{ type: "ClassPartnership", id: body.partnerId }]
        }),

        updateClassPartnership: build.mutation({
            query: ({ id, payload }) => ({
                url: `/memberRoute/updateClassPartnership/${id}`,
                method: "PUT",
                body: payload
            }),
            invalidatesTags: (result, error, { payload }) => [{ type: "ClassPartnership", id: payload?.partnerId }]
        }),

        deleteClassPartnership: build.mutation({
            query: (id) => ({
                url: `/memberRoute/deleteClassPartnership/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["ClassPartnership"]
        }),
        createClassPartnershipPayment: build.mutation({
            query: (body) => ({
                url: `/memberRoute/${body.classPartnershipId}/payments`,
                method: "POST",
                body
            }),
            invalidatesTags: ["ClassPartnership"]
        }),
        deleteClassPartnershipPayment: build.mutation({
            query: (body) => {
                console.log("Deleting payment with body", body)
                return ({
                url: `/memberRoute/${body.partnershipId}/payments/${body.paymentId}`,
                method: "DELETE"
            })
            },
            invalidatesTags: ["ClassPartnership"]
        }),
        updateClassPartnershipPayment: build.mutation({
            query: (body) => ({
                url: `/memberRoute/${body.classPartnershipId}/payments/${body.id}`,
                method: "PUT",
                body: body 
            }),
            invalidatesTags: ["ClassPartnership"]
        }),









        // salary change 
        createSalaryChange: build.mutation({
            query: (body) => ({
                url: "/memberRoute/salaryCreate",
                method: "POST",
                body
            }),
            invalidatesTags: (result, error, body) => { console.log("tagging", body); return [{ type: "MemberSalaryChange", id: body.memberId }] }
        }),
        updateSalaryChange: build.mutation({
            query: (body) => ({
                url: `/memberRoute/salaryUpdate/${body.id}`,
                method: "PUT",
                body
            }),
            invalidatesTags: (result, error, body) => { console.log("tagging", body); return [{ type: "MemberSalaryChange", id: body.memberId }] }
        }),
        deleteSalaryChange: build.mutation({
            query: ({ id, memberId }) => ({
                url: `/memberRoute/salaryDelete/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: (result, error, { id, memberId }) => { console.log("tagging", id); return [{ type: "MemberSalaryChange", id: memberId }] }
        }),
        getSalaryChangeByMemberId: build.query({
            query: (id) => ({ url: `/memberRoute/salaryHistoryByMemberId/${id}` }),
            transformResponse: (res) => res || [],
            providesTags: (result, error, id) => { console.log("tagging", id); return [{ type: "MemberSalaryChange", id }] }
        }),
















        // Member Attendance
        getAttendanceByDate: build.query({
            query: (body) => ({
                url: "/memberRoute/getSelectedDayMembersAttendenceData",
                method: "POST",
                body
            }),
            providesTags: (result, error, arg) => [{ type: "MemberAttendance", id: arg.date }]
        }),
        markScannerAttendance: build.mutation({
            query: (body) => ({
                url: "/memberRoute/setAttendanceByInstituteIdScanning",
                method: "POST",
                body
            }),
            invalidatesTags: (result, error, arg) => [{ type: "MemberAttendance", id: arg.date }]
        }),
        createDayAttendance: build.mutation({
            query: (body) => ({
                url: "/memberRoute/createdSeletedDayMemberAttendence",
                method: "POST",
                body
            }),
            invalidatesTags: (result, error, arg) => [{ type: "MemberAttendance", id: arg.date }]
        }),
        updateMemberAttendanceStatus: build.mutation({
            query: (body) => ({
                url: "/memberRoute/setMemberAttendence",
                method: "POST",
                body
            }),
            invalidatesTags: ['MemberAttendance']
        })






















    })
})

export const {
    useGetAllMembersQuery,
    useGetMemberByIdQuery,
    useCreateMemberMutation,
    useUpdateMemberMutation,
    useDeleteMemberMutation,
    useGetMemberAttendanceQuery,
    useUploadMemberDocumentMutation,
    useDeleteMemberDocumentMutation,
    useGetMemberFinanceQuery,
    useCreateSalaryPaymentMutation,
    useDeleteSalaryPaymentMutation,
    useGetInvestmentsByPartnerIdQuery,
    useCreatePartnerInvestmentMutation,
    useUpdatePartnerInvestmentMutation,
    useDeletePartnerInvestmentMutation,
    useGetClassPartnershipsByPartnerIdQuery,
    useCreateClassPartnershipMutation,
    useUpdateClassPartnershipMutation,
    useDeleteClassPartnershipMutation,
    useCreateClassPartnershipPaymentMutation,
    useDeleteClassPartnershipPaymentMutation,
    useUpdateClassPartnershipPaymentMutation,
    useCreateSalaryChangeMutation,
    useUpdateSalaryChangeMutation,
    useDeleteSalaryChangeMutation,
    useGetSalaryChangeByMemberIdQuery,
    useGetAttendanceByDateQuery,
    useMarkScannerAttendanceMutation,
    useCreateDayAttendanceMutation,
    useUpdateMemberAttendanceStatusMutation
} = memberApi