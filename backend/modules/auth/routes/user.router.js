import { Router } from "express";
import {
    getAllUsersController,
    getUserByIdController,
    createUserByAdminController,
    updateUserByAdminController,
    deleteUserByAdminController,
} from "../controllers/user.controller.js";

const router = Router();

router.get("/all", getAllUsersController);
router.get("/:id", getUserByIdController);
router.post("/create", createUserByAdminController);
router.put("/update", updateUserByAdminController);
router.delete("/delete", deleteUserByAdminController);

export default router;
