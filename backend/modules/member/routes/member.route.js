import express from 'express';
const route = express.Router();
import {
    memberCreation, memberUpdate, memberDelete, getAllMemberData, getMemberDataOnId,
    checkDublicateMemberInstituteId, getInvesterPayments,
    getSelectedDayMembersAttendenceData, createdSeletedDayMemberAttendence,
    setMemberAttendence, setAttendanceByInstituteIdScanning, fromTillTimeAttendenceCalculation,
    createMemberSalaryPayment, getMemberSalaryPayments, getCurrentMonthSalaryPayments,
    updateSalaryPaymentController, deleteSalaryPaymentController, getMemberFinanceData,
    uploadMemberDocuments, deleteMemberDocument,
    getPartnerInvestmentById, getInvestmentsByPartnerId, partnerInvestmentCreation,
    deletePartnerInvestment, updatePartnerInvestment,
    createClassPartnership, getPartnershipsByPartnerId, updateClassPartnership, deleteClassPartnership,
    addClassPartnershipPaymentController, updateClassPartnershipPaymentController, deleteClassPartnershipPaymentController,
} from '../controllers/member.controller.js';
import * as salaryChangeController from '../controllers/memberSalaryChange.controller.js';
import { upload } from '../../../common/middlewares/multer.middleware.js';

// ─── Member CRUD ──────────────────────────────────────────────────────────────
route.post('/memberCreation', upload.single('memberProfileImage'), memberCreation);
route.post('/memberUpdate', upload.fields([
    { name: 'memberProfileImage', maxCount: 1 },
    { name: 'documents', maxCount: 10 }
]), memberUpdate);
route.post('/memberDelete', memberDelete);
route.get('/getAllMembersData', getAllMemberData);
route.post('/getMemberDataOnId', getMemberDataOnId);
route.post('/checkDublicateMemberInstituteId/:memberId', checkDublicateMemberInstituteId);

// ─── Finance ──────────────────────────────────────────────────────────────────
route.post('/getInvesterPayments', getInvesterPayments);
route.post('/getMemberFinanceData', getMemberFinanceData);

// ─── Attendance ───────────────────────────────────────────────────────────────
route.post('/getSelectedDayMembersAttendenceData', getSelectedDayMembersAttendenceData);
route.post('/createdSeletedDayMemberAttendence', createdSeletedDayMemberAttendence);
route.post('/setMemberAttendence', setMemberAttendence);
route.post('/setAttendanceByInstituteIdScanning', setAttendanceByInstituteIdScanning);
route.post('/fromTillTimeAttendenceCalculation', fromTillTimeAttendenceCalculation);

// ─── Salary Payments ──────────────────────────────────────────────────────────
route.post('/createMemberSalaryPayment', createMemberSalaryPayment);
route.post('/getMemberSalaryPayments', getMemberSalaryPayments);
route.post('/getCurrentMonthSalaryPayments', getCurrentMonthSalaryPayments);
route.put('/updateSalaryPayment', updateSalaryPaymentController);
route.delete('/deleteSalaryPayment', deleteSalaryPaymentController);

// ─── Salary Change History ────────────────────────────────────────────────────
route.post('/salaryCreate', salaryChangeController.create);
route.get('/salaryGetAll', salaryChangeController.getAll);
route.get('/salaryGetOne/:id', salaryChangeController.getOne);
route.put('/salaryUpdate/:id', salaryChangeController.update);
route.delete('/salaryDelete/:id', salaryChangeController.remove);
route.get('/salaryHistoryByMemberId/:id', salaryChangeController.getByMemberId);

// ─── Documents ────────────────────────────────────────────────────────────────
route.post('/uploadMemberDocuments', upload.array('documents', 10), uploadMemberDocuments);
route.post('/deleteMemberDocument', deleteMemberDocument);

// ─── Partner Investments ──────────────────────────────────────────────────────
route.get('/getPartnerInvestmentById/:id', getPartnerInvestmentById);
route.get('/getInvestmentsByPartnerId/:partnerId', getInvestmentsByPartnerId);
route.post('/partnerInvestmentCreation', partnerInvestmentCreation);
route.delete('/deletePartnerInvestment/:id', deletePartnerInvestment);
route.put('/updatePartnerInvestment/:id', updatePartnerInvestment);

// ─── Class Partnerships ───────────────────────────────────────────────────────
route.post('/createClassPartnership', createClassPartnership);
route.get('/getPartnershipsByPartnerId/:partnerId', getPartnershipsByPartnerId);
route.delete('/deleteClassPartnership/:id', deleteClassPartnership);
route.put('/updateClassPartnership/:id', updateClassPartnership);
route.post('/:classPartnershipId/payments', addClassPartnershipPaymentController);
route.put('/:classPartnershipId/payments/:paymentId', updateClassPartnershipPaymentController);
route.delete('/:classPartnershipId/payments/:paymentId', deleteClassPartnershipPaymentController);

export default route;
