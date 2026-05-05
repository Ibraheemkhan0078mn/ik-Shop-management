import { Router } from "express";
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getPaginationProduct,
    getSubCategories,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory,
    getPaginationSubCategories,
    getSubCategoriesById,
    getSubCategoriesByCatagId,
} from "../controllers/product.controller.js";
import { protect, authorize } from "../../auth/middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/", getProducts);
router.get("/pagination", getPaginationProduct);
router.get("/:id", getProductById);
router.post("/", authorize("admin"), createProduct);
router.put("/:id", authorize("admin"), updateProduct);
router.delete("/:id", authorize("admin"), deleteProduct);





router.get("/subCategories", getSubCategories);
router.post("/subCategories", authorize("admin"), createSubCategory);
router.get("/subCategories/getPaginationSubCategories", getPaginationSubCategories);
router.put("/subCategories/:id", updateSubCategory);
router.delete("/subCategories/:id", authorize("admin"), deleteSubCategory);
router.get("/subCategories/getSubCategoriesById/:id", getSubCategoriesById);
router.get("/subCategories/getSubCategoriesByCatagId/:id", getSubCategoriesByCatagId);






export default router;
