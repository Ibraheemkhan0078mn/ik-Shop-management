import express from "express";
const router = express.Router();
import { createQarzaPayment, deleteQarzaPayment, getAllQarzaAccount, getqarzaAccount, getQarzaAccountRelatedPayments, qarzaAccountCreate, qarzaAccountDelete, qarzaAccountUpdate, updateQarzaPayment, getPaginatedQarzaAccounts } from "../controllers/qarza.controller.js";
import { upload } from '../../../common/middlewares/multer.middleware.js'




router.post("/qarzaAccountCreate", upload.single("qarzaProfileImage"), qarzaAccountCreate);
router.get("/getqarzaAccount", getqarzaAccount);
router.get("/getAllQarzaAccount", getAllQarzaAccount);
router.get("/pagination", getPaginatedQarzaAccounts);
router.put("/qarzaAccountUpdate", upload.single("qarzaProfileImage"), qarzaAccountUpdate);
router.delete("/qarzaAccountDelete", qarzaAccountDelete);
router.post("/createQarzaPayment", createQarzaPayment);
router.put("/updateQarzaPayment", updateQarzaPayment);
router.delete("/deleteQarzaPayment", deleteQarzaPayment);
router.post("/getQarzaAccountRelatedPayments", getQarzaAccountRelatedPayments);




export default router;
