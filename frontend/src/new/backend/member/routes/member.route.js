import express from 'express'
const route = express.Router()
import { addClassPartnershipPaymentController, checkDublicateMemberInstituteId, createClassPartnership, createdSeletedDayMemberAttendence, createMemberSalaryPayment, deleteClassPartnership, deletePartnerInvestment, deleteSalaryPaymentController, deleteMemberDocument, fromTillTimeAttendenceCalculation, getAllMemberData, getCurrentMonthSalaryPayments, getInvesterPayments, getInvestmentsByPartnerId, getPartnerInvestmentById, getPartnershipsByPartnerId, getSelectedDayMembersAttendenceData, getMemberDataOnId, getMemberFinanceData, getMemberPayslip, getMemberSalaryPayments, partnerInvestmentCreation, setAttendanceByInstituteIdScanning, setMemberAttendence, memberCreation, memberDelete, memberUpdate, updateClassPartnership, updateClassPartnershipPaymentController, updatePartnerInvestment, updateSalaryPaymentController, uploadMemberDocuments, deleteClassPartnershipPaymentController } from '../controllers/member.controller.js';
import { upload } from '../../../shared/utils/multer.middleware.js'
import * as paymentController from '../controllers/memberSalaryChange.controller.js';

route.post("/memberCreation", upload.single("memberProfileImage"), memberCreation)
route.post("/memberUpdate", upload.fields([
    { name: "memberProfileImage", maxCount: 1 },
    { name: "documents", maxCount: 10 }
]), memberUpdate)
route.post("/memberDelete", memberDelete)
route.get("/getAllMembersData", getAllMemberData)
route.post("/getMemberDataOnId", getMemberDataOnId)
route.post("/checkDublicateMemberInstituteId/:memberId", checkDublicateMemberInstituteId)

route.post("/getInvesterPayments", getInvesterPayments)

route.post("/getSelectedDayMembersAttendenceData", getSelectedDayMembersAttendenceData)
route.post("/createdSeletedDayMemberAttendence", createdSeletedDayMemberAttendence)
route.post("/setMemberAttendence", setMemberAttendence)
route.post("/setAttendanceByInstituteIdScanning", setAttendanceByInstituteIdScanning)
route.post("/fromTillTimeAttendenceCalculation", fromTillTimeAttendenceCalculation)

route.post("/createMemberSalaryPayment", createMemberSalaryPayment)
route.post("/getMemberSalaryPayments", getMemberSalaryPayments)
route.post("/getCurrentMonthSalaryPayments", getCurrentMonthSalaryPayments)
route.put("/updateSalaryPayment", updateSalaryPaymentController)
route.delete("/deleteSalaryPayment", deleteSalaryPaymentController)
route.post("/getMemberFinanceData", getMemberFinanceData)
route.post("/getMemberPayslip", getMemberPayslip)

route.post('/salaryCreate', paymentController.create);
route.get('/salaryGetAll', paymentController.getAll);
route.get('/salaryGetOne/:id', paymentController.getOne);
route.put('/salaryUpdate/:id', paymentController.update);
route.delete('/salaryDelete/:id', paymentController.remove);
route.get("/salaryHistoryByMemberId/:id", paymentController.getByMemberId)

route.post("/uploadMemberDocuments", upload.array("documents", 10), uploadMemberDocuments);
route.post("/deleteMemberDocument", deleteMemberDocument)

route.get("/getPartnerInvestmentById/:id", getPartnerInvestmentById)
route.get("/getInvestmentsByPartnerId/:partnerId", getInvestmentsByPartnerId)
route.post("/partnerInvestmentCreation", partnerInvestmentCreation)
route.delete("/deletePartnerInvestment/:id", deletePartnerInvestment)
route.put("/updatePartnerInvestment/:id", updatePartnerInvestment)

route.post("/createClassPartnership", createClassPartnership)
route.get("/getPartnershipsByPartnerId/:partnerId", getPartnershipsByPartnerId)
route.delete("/deleteClassPartnership/:id", deleteClassPartnership)
route.put("/updateClassPartnership/:id", updateClassPartnership)
route.post("/:classPartnershipId/payments", addClassPartnershipPaymentController);
route.put("/:classPartnershipId/payments/:paymentId", updateClassPartnershipPaymentController);
route.delete("/:classPartnershipId/payments/:paymentId", deleteClassPartnershipPaymentController);

export default route;
