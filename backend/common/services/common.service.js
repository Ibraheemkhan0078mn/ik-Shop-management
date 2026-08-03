export const paginateModel = async ({ model, page = 1, limit = 20, populate = [], sort = { createdAt: -1 } }) => {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = model.find().sort(sort).skip(skip).limit(limitNum);

    populate.forEach(p => { query = query.populate(p); });

    const [data, total] = await Promise.all([
        query,
        model.countDocuments()
    ]);

    return {
        data,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasMore: pageNum * limitNum < total
    };
};