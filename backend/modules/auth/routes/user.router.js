import { Router } from "express";
import {
    getAllUsersController,
    getUserByIdController,
    getUserByIdWithPasswordController,
    createUserByAdminController,
    updateUserByAdminController,
    deleteUserByAdminController,
} from "../controllers/user.controller.js";

const router = Router();

router.get("/all", getAllUsersController);
router.get("/:id", getUserByIdController);
router.get("/:id/with-password", getUserByIdWithPasswordController);
router.post("/create", createUserByAdminController);
router.put("/update", updateUserByAdminController);
router.delete("/delete", deleteUserByAdminController);

export default router;
