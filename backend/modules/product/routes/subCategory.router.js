import { Router } from "express";
import {
    getSubCategories,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory,
} from "../controllers/subCategory.controller.js";
import { protect, authorize } from "../../auth/middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/", getSubCategories);
router.post("/", authorize("admin"), createSubCategory);
router.put("/:id", authorize("admin"), updateSubCategory);
router.delete("/:id", authorize("admin"), deleteSubCategory);

export default router;
