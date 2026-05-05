import { Router } from "express";
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getPaginationCategories,
    getCategoryById,
} from "../controllers/category.controller.js";
import { protect, authorize } from "../../auth/middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/", getCategories);
router.get("/getPaginationCategories", getPaginationCategories)
router.post("/", authorize("admin"), createCategory);
router.put("/:id", authorize("admin"), updateCategory);
router.delete("/:id", authorize("admin"), deleteCategory);
router.get("/getCategoryById/:id", getCategoryById)

export default router;
