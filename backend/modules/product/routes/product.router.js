import { Router } from "express";
import {
    getProductsData,
    getProductDataById,
    createProductData,
    updateProductData,
    deleteProductData,
    deleteProductWithBatchesData,
    getPaginationProductData,
    getSubCategoriesData,
    createSubCategoryData,
    updateSubCategoryData,
    deleteSubCategoryData,
    getPaginationSubCategoriesData,
    getSubCategoriesDataById,
    getSubCategoriesDataByCatagId,
    uploadProductImage,
} from "../controllers/product.controller.js";
import { protect, authorize } from "../../auth/middlewares/auth.middleware.js";
import { upload } from "../../../common/middlewares/multer.middleware.js";
 
const router = Router();

router.use(protect);

router.get("/", getProductsData);
router.get("/pagination", getPaginationProductData);
router.get("/:id", getProductDataById);
router.post("/", authorize("admin"), upload.single("image"), createProductData);
router.put("/:id", authorize("admin"), upload.single("image"), updateProductData);
// Hard delete — must sit above the generic /:id delete route.
router.delete("/:id/with-batches", authorize("admin"), deleteProductWithBatchesData);
router.delete("/:id", authorize("admin"), deleteProductData);
router.post("/upload-image", upload.single("image"), uploadProductImage);





router.get("/subCategories", getSubCategoriesData);
router.post("/subCategories", authorize("admin"), createSubCategoryData);
router.get("/subCategories/getPaginationSubCategories", getPaginationSubCategoriesData);
router.put("/subCategories/:id", updateSubCategoryData);
router.delete("/subCategories/:id", authorize("admin"), deleteSubCategoryData);
router.get("/subCategories/getSubCategoriesById/:id", getSubCategoriesDataById);
router.get("/subCategories/getSubCategoriesByCatagId/:id", getSubCategoriesDataByCatagId);






export default router;
