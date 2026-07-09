import { getLocalChangeTrackModel } from "../../db/localDbConnection.js";
import { getOnlineChangeTrackModel } from "../../db/onlineDbConnection.js";









export async function notPermittedCleaning(modelsArray, loggedInUserData) {
    try {


        for (let eachCollectionObject of modelsArray) {


            // check if permittted then only running otherwise not intterate on another and again check and so on...
            let userPermissions = loggedInUserData?.permissions
            if (userPermissions && userPermissions?.length > 0) {
                if (!(userPermissions?.some(p => eachCollectionObject.permissionString.includes(p)))) {
                    continue;
                }
            }


            // when loop is running for class then it delete the classes also from local which are not permitted to user. means permistion is changed and new permition these classes are nto allowed
            let allowedClasses = loggedInUserData?.allowedClases
            if (loggedInUserData && eachCollectionObject?.local?.modelName == "class") {
                if (allowedClasses?.length > 0 && !(loggedInUserData?.role == "admin")) {
                    await eachCollectionObject.local.deleteMany({
                        _id: { $nin: allowedClasses }
                    });
                }
            }





            // students related with allowed class only remained other is deleted when class permition is changed by admin.
            if (loggedInUserData && eachCollectionObject?.local?.modelName == "student") {
                if (allowedClasses?.length > 0 && loggedInUserData?.role != "admin") {
                    await eachCollectionObject.local.deleteMany({
                        classId: { $nin: allowedClasses }
                    });
                }
            }







        }

    } catch (error) {
        throw new Error(error)
    }
}




















export async function duplicateChangeTracksServiceCleaning() {
    try {
        const ChangeTrackModel = getOnlineChangeTrackModel();
        const oneMonthAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

        // ── Step 1: 1 month purane sab delete (duplicate ho ya na ho) ─────────
        await ChangeTrackModel.deleteMany({
            updatedAt: { $lt: oneMonthAgo },
        });

        // ── Step 2: Baqi docs mein se duplicates clean karo ───────────────────
        const result = await ChangeTrackModel.aggregate([
            {
                $addFields: {
                    _priority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$operationType", "delete"] }, then: 0 },
                                { case: { $eq: ["$operationType", "create"] }, then: 1 },
                                { case: { $eq: ["$operationType", "update"] }, then: 2 },
                            ],
                            default: 3,
                        },
                    },
                },
            },
            { $sort: { documentId: 1, _priority: 1 } },
            {
                $group: {
                    _id: "$documentId",
                    keepId: { $first: "$_id" },
                    allIds: { $push: "$_id" },
                    total: { $sum: 1 },
                },
            },
            { $match: { total: { $gt: 1 } } },
            {
                $project: {
                    toDeleteIds: {
                        $filter: {
                            input: "$allIds",
                            as: "id",
                            cond: { $ne: ["$$id", "$keepId"] },
                        },
                    },
                },
            },
        ]);

        if (!result.length) return { deleted: 0 };

        const idsToDelete = result.flatMap((r) => r.toDeleteIds);

        const { deletedCount } = await ChangeTrackModel.deleteMany({
            _id: { $in: idsToDelete },
        });

        return { deleted: deletedCount };

    } catch (err) {
        console.error("[duplicateChangeTracksServiceCleaning]", err);
        throw err;
    }
}