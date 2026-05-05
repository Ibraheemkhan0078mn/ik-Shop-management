import express from 'express'
const route = express.Router()
import { checkDublicateTeacherInstituteId, createdSeletedDayTeacherAttendence, createTeacherSalaryPayment, deletePartnerInvestment, deleteSalaryPayment, deleteTeacherDocument, fromTillTimeAttendenceCalculation, getAllTeacherData, getCurrentMonthSalaryPayments, getInvesterPayments, getInvestmentsByPartnerId, getPartnerInvestmentById, getSelectedDayTeachersAttendenceData, getTeacherDataOnId, getTeacherFinanceData, getTeacherPayslip, getTeacherSalaryPayments, partnerInvestmentCreation, recalculateAndRefiltTeacherInvoicesAll, setTeacherAttendence, teacherCreation, teacherDelete, teacherInvoiceGeneration, teacherUpdate, updatePartnerInvestment, updateSalaryPayment, updateTeacherInvoice, uploadTeacherDocuments } from '../controllers/teacher.controller.js';
import { upload } from '../../../common/middlewares/multer.middleware.js'



route.post("/teacherCreation", upload.single("teacherProfileImage"), teacherCreation)
route.post("/teacherUpdate", upload.fields([
    { name: "teacherProfileImage", maxCount: 1 },
    { name: "documents", maxCount: 10 }
]), teacherUpdate)
// route.post("/teacherUpdate",upload.single("teacherProfileImage"), upload.fields("documents"), teacherUpdate)
route.post("/teacherDelete", teacherDelete)
route.get("/getAllTeachersData", getAllTeacherData)
route.post("/getTeacherDataOnId", getTeacherDataOnId)
route.post("/checkDublicateTeacherInstituteId/:teacherId", checkDublicateTeacherInstituteId)




route.post("/getInvesterPayments", getInvesterPayments)


route.post("/getSelectedDayTeachersAttendenceData", getSelectedDayTeachersAttendenceData)
route.post("/createdSeletedDayTeacherAttendence", createdSeletedDayTeacherAttendence)
route.post("/setTeacherAttendence", setTeacherAttendence)
route.post("/fromTillTimeAttendenceCalculation", fromTillTimeAttendenceCalculation)




route.post("/createTeacherSalaryPayment", createTeacherSalaryPayment)
route.post("/getTeacherSalaryPayments", getTeacherSalaryPayments)
route.post("/getCurrentMonthSalaryPayments", getCurrentMonthSalaryPayments)
route.put("/updateSalaryPayment", updateSalaryPayment)
route.delete("/deleteSalaryPayment", deleteSalaryPayment)
route.post("/teacherInvoiceGeneration", teacherInvoiceGeneration)
route.post("/recalculateAndRefiltTeacherInvoicesAll", recalculateAndRefiltTeacherInvoicesAll)
route.post("/getTeacherFinanceData", getTeacherFinanceData)
route.post("/updateTeacherInvoice", updateTeacherInvoice)
route.post("/getTeacherPayslip", getTeacherPayslip)




route.post("/uploadTeacherDocuments", upload.array("documents", 10), uploadTeacherDocuments);
route.post("/deleteTeacherDocument", deleteTeacherDocument)








route.get("/getPartnerInvestmentById/:id", getPartnerInvestmentById)
route.get("/getInvestmentsByPartnerId/:partnerId", getInvestmentsByPartnerId)
route.post("/partnerInvestmentCreation", partnerInvestmentCreation)
route.delete("/deletePartnerInvestment/:id", deletePartnerInvestment)
route.put("/updatePartnerInvestment/:id", updatePartnerInvestment)


















export default route;