import {
    createBrandService,
    findBrandService,
    findOneBrandService,
    findByIdBrandService,
    updateBrandService,
    deleteOneBrandService,
    countBrandService,
} from "./brand.crud.js";

const getBrands = async () => {
    const brands = await findBrandService({}, {
        sort: { createdAt: -1 }
    });
    return brands;
};

const getPaginationBrands = async (filters = {}) => {
    const { page = 1, limit = 20, search, ...filterParams } = filters;
    const skip = (page - 1) * limit;

    const query = {};

    // Search filter (name)
    if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.name = searchRegex;
    }

    // Active status filter
    if (filterParams.isActive !== undefined) {
        query.isActive = filterParams.isActive === 'true' || filterParams.isActive === true;
    }

    const brands = await findBrandService(query, {
        sort: { createdAt: -1 },
        skip: skip,
        limit: parseInt(limit),
    });

    const total = await countBrandService(query);

    return {
        data: brands,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
    };
};

const getBrandById = async (id) => {
    return await findByIdBrandService(id);
};

const createBrand = async (brandData) => {
    // Check for duplicate brand name
    const existing = await findOneBrandService({ name: brandData.name });
    if (existing) {
        throw new Error("Brand with this name already exists");
    }
    return await createBrandService(brandData);
};

const updateBrand = async (id, updateData) => {
    const existing = await findByIdBrandService(id);
    if (!existing) {
        throw new Error("Brand not found");
    }

    // Check for duplicate name if name is being changed
    if (updateData.name && updateData.name !== existing.name) {
        const duplicate = await findOneBrandService({ name: updateData.name });
        if (duplicate) {
            throw new Error("Brand with this name already exists");
        }
    }

    return await updateBrandService(id, { ...updateData, updated: Date.now() });
};

const deleteBrand = async (id) => {
    const existing = await findByIdBrandService(id);
    if (!existing) {
        throw new Error("Brand not found");
    }
    return await deleteOneBrandService(id);
};

const searchBrands = async (query = "", limit = 20) => {
    if (!query || query.length < 2) {
        return [];
    }
    
    const searchRegex = new RegExp(query, 'i');
    
    const brands = await findBrandService({
        name: searchRegex,
        isDeleted: { $ne: true },
        isActive: { $ne: false }
    }, {
        limit: parseInt(limit),
        sort: { name: 1 }
    });
    
    return brands;
};

export {
    getBrands,
    getPaginationBrands,
    getBrandById,
    createBrand,
    updateBrand,
    deleteBrand,
    searchBrands,
};
