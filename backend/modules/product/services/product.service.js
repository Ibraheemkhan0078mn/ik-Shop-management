import { createProductService, findProductService, findOneProductService, findByIdProductService, updateProductService, deleteOneProductService, countProductService } from "./product.crud.js";
import { getLocalBatchModel } from "../../../configs/connect.db.js";
import { filterEmptyValues } from "../../../common/services/filterEmptyFromObject.js";

const getProducts = async () => {
    const BatchModel = getLocalBatchModel();
    const products = await findProductService()
        .populate("batches")
        .populate("category")
        .populate("subCategory")
        .sort({ createdAt: -1 });

    const productsWithPrice = await Promise.all(
        products.map(async (product) => {
            if (!product.batches || product.batches.length === 0) {
                return { ...product.toObject(), batchSellingPrice: product.defaultSalePrice || 0 };
            }
            const activeBatches = await BatchModel.find({
                product: product._id,
                quantity: { $gt: 0 },
                isActive: true
            });
            if (activeBatches.length === 0) {
                return { ...product.toObject(), batchSellingPrice: product.defaultSalePrice || 0 };
            }
            const sortedBatches = activeBatches
                .filter(b => b.expiryDate)
                .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
            const selectedBatch = sortedBatches.length > 0
                ? sortedBatches[0]
                : activeBatches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
            return { ...product.toObject(), batchSellingPrice: selectedBatch.sellingPrice || product.defaultSalePrice || 0 };
        })
    );
    return productsWithPrice;
};

const getPaginationProduct = async (filters = {}) => {
    const BatchModel = getLocalBatchModel();
    const { page = 1, limit = 20 } = filters;
    const query = {};
    const products = await findProductService(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate("batches")
        .populate("category")
        .populate("subCategory");
    const total = await countProductService(query);

    const productsWithPrice = await Promise.all(
        products.map(async (product) => {
            if (!product.batches || product.batches.length === 0) {
                return { ...product.toObject(), batchSellingPrice: product.defaultSalePrice || 0 };
            }
            const activeBatches = await BatchModel.find({
                product: product._id,
                quantity: { $gt: 0 },
                isActive: true
            });
            if (activeBatches.length === 0) {
                return { ...product.toObject(), batchSellingPrice: product.defaultSalePrice || 0 };
            }
            const sortedBatches = activeBatches
                .filter(b => b.expiryDate)
                .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
            const selectedBatch = sortedBatches.length > 0
                ? sortedBatches[0]
                : activeBatches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
            return { ...product.toObject(), batchSellingPrice: selectedBatch.sellingPrice || product.defaultSalePrice || 0 };
        })
    );

    return {
        data: productsWithPrice,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
    };
};

const getProductById = async (id) => {
    return await findByIdProductService(id)
        .populate("category", "name")
        .populate("subCategory", "name")
        .populate("batches");
};

const createProduct = async (productData) => {
    const validatedData = filterEmptyValues(productData);
    const { hotKeySku, productCode } = validatedData;
    const existingProduct = await findOneProductService({
        $or: [
            { hotKeySku },
            { productCode: { $ne: null, $eq: productCode } },
        ],
    });
    if (existingProduct) {
        throw new Error("Product with this SKU or Product Code already exists");
    }
    console.log("The image", productData.image)
    return await createProductService(validatedData);
};

const updateProduct = async (id, updateData) => {
    const product = await findByIdProductService(id);
    if (!product) {
        throw new Error("Product not found");
    }
    if (updateData.hotKeySku || updateData.productCode || updateData.barcode) {
        const query = { _id: { $ne: id }, $or: [] };
        if (updateData.hotKeySku) query.$or.push({ hotKeySku: updateData.hotKeySku });
        if (updateData.productCode) query.$or.push({ productCode: updateData.productCode });
        if (updateData.barcode) query.$or.push({ barcode: updateData.barcode });
        if (query.$or.length > 0) {
            const duplicateCheck = await findOneProductService(query);
            if (duplicateCheck) {
                throw new Error("SKU, Product Code, or Barcode is already in use by another product");
            }
        }
    }
    return await updateProductService(id, { ...updateData, updated: Date.now() });
};

const deleteProduct = async (id) => {
    const BatchModel = getLocalBatchModel();
    const product = await findByIdProductService(id);
    if (!product) {
        throw new Error("Product not found");
    }
    const batches = await BatchModel.find({ product: id });
    if (batches.length > 0) {
        throw new Error("Cannot delete product with existing batches");
    }
    return await deleteOneProductService(id);
};

export { getProducts, getPaginationProduct, getProductById, createProduct, updateProduct, deleteProduct };
