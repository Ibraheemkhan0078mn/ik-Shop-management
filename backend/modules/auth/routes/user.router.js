import { Router } from "express";
import {
    getAllUsersController,
    getUserByIdController,
    getUserByIdWithPasswordController,
    createUserByAdminController,
    updateUserByAdminController,
    deleteUserByAdminController,
} from "../controllers/user.controller.js";
import { upload } from "../../../common/middlewares/multer.middleware.js";

const router = Router();

router.get("/all", getAllUsersController);
router.get("/:id", getUserByIdController);
router.get("/:id/with-password", getUserByIdWithPasswordController);
router.post("/create", upload.single("photo"), createUserByAdminController);
router.put("/update", upload.single("photo"), updateUserByAdminController);
router.delete("/delete", deleteUserByAdminController);

export default router;
