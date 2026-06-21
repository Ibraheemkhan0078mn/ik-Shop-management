import { Router } from "express";
import {
    getProductsData,
    getProductDataById,
    createProductData,
    updateProductData,
    deleteProductData,
    getPaginationProductData,
    getSubCategoriesData,
    createSubCategoryData,
    updateSubCategoryData,
    deleteSubCategoryData,
    getPaginationSubCategoriesData,
    getSubCategoriesDataById,
    getSubCategoriesDataByCatagId,
} from "../controllers/product.controller.js";
import { protect, authorize } from "../../auth/middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/", getProductsData);
router.get("/pagination", getPaginationProductData);
router.get("/:id", getProductDataById);
router.post("/", authorize("admin"), createProductData);
router.put("/:id", authorize("admin"), updateProductData);
router.delete("/:id", authorize("admin"), deleteProductData);





router.get("/subCategories", getSubCategoriesData);
router.post("/subCategories", authorize("admin"), createSubCategoryData);
router.get("/subCategories/getPaginationSubCategories", getPaginationSubCategoriesData);
router.put("/subCategories/:id", updateSubCategoryData);
router.delete("/subCategories/:id", authorize("admin"), deleteSubCategoryData);
router.get("/subCategories/getSubCategoriesById/:id", getSubCategoriesDataById);
router.get("/subCategories/getSubCategoriesByCatagId/:id", getSubCategoriesDataByCatagId);






export default router;
