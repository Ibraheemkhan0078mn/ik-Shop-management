import { Router } from "express";
import {
    getBrandsData,
    createBrandData,
    updateBrandData,
    deleteBrandData,
    getPaginationBrandsData,
    getBrandDataById,
    searchBrandsData,
} from "../controllers/brand.controller.js";
import { protect, authorize } from "../../auth/middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/", getBrandsData);
router.get("/getPaginationBrands", getPaginationBrandsData);
router.get("/search", searchBrandsData);
router.post("/", authorize("admin"), createBrandData);
router.put("/:id", authorize("admin"), updateBrandData);
router.delete("/:id", authorize("admin"), deleteBrandData);
router.get("/getBrandById/:id", getBrandDataById);

export default router;
