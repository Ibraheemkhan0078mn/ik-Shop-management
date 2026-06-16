import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "../../../services/axiosInstance.js";






const tanstackErrorHandler = (error) => { toast.error(error.message || error?.stack) }




async function getTimeBasedAttendance(teacherId, startOfMonth, endOfMonth) {
    try {


        let now = new Date();
        startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
        endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));



        const res = await api.post("/memberRoutes/fromTillTimeAttendenceCalculation", {
            fromDate: startOfMonth, tillDate: endOfMonth, teacherDocId: teacherId
        });

        return res.data || null

    } catch (error) {
        tanstackErrorHandler(error)
    }
}




export const useGetTimeBasesTeacherAttendance = (teacherId) => {

    return useQuery({
        queryFn: () => getTimeBasedAttendance(teacherId),
        queryKey: ["teacherAttendance", teacherId]
    })
}