import express from "express";
const router = express.Router();
import { createQarzaPayment, deleteQarzaPayment, getAllQarzaAccount, getqarzaAccount, getQarzaAccountRelatedPayments, qarzaAccountCreate, qarzaAccountDelete, qarzaAccountUpdate, updateQarzaPayment, getPaginatedQarzaAccounts, getPaginatedQarzaPayments, getQarzaAccountPaymentsSummary, getCreditsDebitsReport, getAccountLedger, getPaginatedQarzaPaymentsWithoutAccount, getManualPayments, getSupplierPayments, getCustomerPayments, getManualPaymentsSummary, getSupplierPaymentsSummary, getCustomerPaymentsSummary, recalculateCustomerAccountBalance, recalculateSupplierAccountBalance, recalculateGeneralAccountBalanceController, searchQarzaAccountsData } from "../controllers/qarza.controller.js";
import { upload } from '../../../common/middlewares/multer.middleware.js'




router.post("/qarzaAccountCreate", upload.single("qarzaProfileImage"), qarzaAccountCreate);
router.get("/getqarzaAccount", getqarzaAccount);
router.get("/getAllQarzaAccount", getAllQarzaAccount);
router.get("/search", searchQarzaAccountsData);
router.get("/pagination", getPaginatedQarzaAccounts);
router.get("/payments/pagination", getPaginatedQarzaPayments);
router.get("/payments/pagination/without-account", getPaginatedQarzaPaymentsWithoutAccount);
router.get("/payments/manual", getManualPayments);
router.get("/payments/supplier", getSupplierPayments);
router.get("/payments/customer", getCustomerPayments);
router.get("/payments/summary", getQarzaAccountPaymentsSummary);
router.get("/payments/summary/manual", getManualPaymentsSummary);
router.get("/payments/summary/supplier", getSupplierPaymentsSummary);
router.get("/payments/summary/customer", getCustomerPaymentsSummary);
router.get("/credits-debits/report", getCreditsDebitsReport);
router.get("/credits-debits/ledger/:accountId", getAccountLedger);
router.put("/qarzaAccountUpdate", upload.single("qarzaProfileImage"), qarzaAccountUpdate);
router.delete("/qarzaAccountDelete", qarzaAccountDelete);
router.post("/createQarzaPayment", createQarzaPayment);
router.put("/updateQarzaPayment", updateQarzaPayment);
router.delete("/deleteQarzaPayment", deleteQarzaPayment);
router.post("/getQarzaAccountRelatedPayments", getQarzaAccountRelatedPayments);
router.post("/recalculate/customer/:qarzaAccountId", recalculateCustomerAccountBalance);
router.post("/recalculate/supplier/:qarzaAccountId", recalculateSupplierAccountBalance);
router.post("/recalculate/general/:qarzaAccountId", recalculateGeneralAccountBalanceController);




export default router;
