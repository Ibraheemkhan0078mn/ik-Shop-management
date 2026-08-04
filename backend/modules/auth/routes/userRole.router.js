import { Router } from "express";
import {
    getAllUserRolesController,
    getUserRoleByIdController,
    createUserRoleController,
    updateUserRoleController,
    deleteUserRoleController,
} from "../controllers/userRole.controller.js";

const router = Router();

router.get("/all", getAllUserRolesController);
router.get("/:id", getUserRoleByIdController);
router.post("/create", createUserRoleController);
router.put("/update", updateUserRoleController);
router.delete("/delete", deleteUserRoleController);

export default router;
